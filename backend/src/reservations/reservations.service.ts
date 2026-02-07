import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationStatus } from './reservations.schema';
import { Event, EventStatus } from '../events/event.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<Reservation>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
  ) {}

  async create(createDto: CreateReservationDto, userId: string) {
    const event = await this.eventModel.findById(createDto.eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new ConflictException('Event is not available for reservation');
    }

    const eventId = (
      event._id as unknown as { toString: () => string }
    ).toString();

    // Check for existing active reservation for this user & event
    const existing = await this.reservationModel
      .findOne({
        event: eventId,
        participant: userId,
        status: {
          $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'You already have a reservation for this event',
      );
    }

    // Check capacity (count PENDING + CONFIRMED)
    const activeCount = await this.reservationModel.countDocuments({
      event: eventId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    });

    if (activeCount >= event.capacity) {
      throw new ConflictException('Event is full');
    }

    const reservation = new this.reservationModel({
      event: eventId,
      participant: userId,
      status: ReservationStatus.PENDING,
    }) as Reservation;

    return reservation.save();
  }

  async findForUser(userId: string) {
    return this.reservationModel
      .find({ participant: userId })
      .populate('event')
      .exec();
  }

  async cancelByParticipant(id: string, userId: string) {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.participant.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }
    if (
      ![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(
        reservation.status,
      )
    ) {
      throw new ConflictException(
        'Only pending or confirmed reservations can be canceled',
      );
    }
    reservation.status = ReservationStatus.CANCELED;
    await reservation.save();
    return reservation;
  }

  async findByEvent(eventId: string) {
    return this.reservationModel
      .find({ event: eventId })
      .populate('participant', 'name email')
      .populate('event')
      .exec();
  }

  async findByParticipant(participantId: string) {
    return this.reservationModel
      .find({ participant: participantId })
      .populate('event')
      .exec();
  }

  async updateStatusAsAdmin(id: string, status: ReservationStatus) {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Handle allowed transitions
    switch (status) {
      case ReservationStatus.CONFIRMED:
      case ReservationStatus.REFUSED:
        if (reservation.status !== ReservationStatus.PENDING) {
          throw new ConflictException(
            'Only pending reservations can be confirmed or refused',
          );
        }
        break;
      case ReservationStatus.CANCELED:
        if (
          ![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(
            reservation.status,
          )
        ) {
          throw new ConflictException(
            'Only pending or confirmed reservations can be canceled',
          );
        }
        break;
      default:
        break;
    }

    // On confirm, re-check capacity safety for CONFIRMED reservations
    if (status === ReservationStatus.CONFIRMED) {
      const event = await this.eventModel.findById(reservation.event).exec();
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      const confirmedCount = await this.reservationModel.countDocuments({
        event: reservation.event,
        status: ReservationStatus.CONFIRMED,
      });
      if (confirmedCount >= event.capacity) {
        throw new ConflictException('Event is full');
      }
    }

    reservation.status = status;
    await reservation.save();
    return reservation;
  }

  async generateTicketPdf(
    id: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<Buffer> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event')
      .populate('participant')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Only owner or admin can download
    const participantDoc = reservation.participant as {
      _id: { toString: () => string };
    };
    if (
      participantDoc._id.toString() !== requesterId &&
      requesterRole !== 'admin'
    ) {
      throw new ForbiddenException(
        'You are not allowed to download this ticket',
      );
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        'Ticket is only available for confirmed reservations',
      );
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const event = reservation.event as unknown as {
        title: string;
        description?: string;
        date: Date;
        location?: string;
      };
      const participant = reservation.participant as unknown as {
        name: string;
        email: string;
      };

      doc.fontSize(20).text('Event Ticket', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Reservation ID: ${reservation._id}`);
      doc.text(`Status: ${reservation.status}`);
      doc.moveDown();

      doc.fontSize(16).text('Event Information');
      doc.fontSize(12).text(`Title: ${event.title}`);
      if (event.description) {
        doc.text(`Description: ${event.description}`);
      }
      doc.text(`Date: ${event.date.toISOString()}`);
      if (event.location) {
        doc.text(`Location: ${event.location}`);
      }
      doc.moveDown();

      doc.fontSize(16).text('Participant');
      doc.fontSize(12).text(`Name: ${participant.name}`);
      doc.text(`Email: ${participant.email}`);

      doc.moveDown();
      doc
        .fontSize(10)
        .text('Please present this ticket at the event entrance.', {
          align: 'center',
        });

      doc.end();
    });
  }
}
