import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './reservations.schema';
import { Event, EventStatus } from '../events/event.schema';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const reservationSaveMock = jest.fn();
  const reservationModelMock: any = jest.fn().mockImplementation(() => ({
    save: reservationSaveMock,
  }));
  reservationModelMock.findOne = jest.fn();
  reservationModelMock.countDocuments = jest.fn();
  reservationModelMock.findById = jest.fn();
  reservationModelMock.find = jest.fn();

  const eventModelMock: any = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: reservationModelMock,
        },
        {
          provide: getModelToken(Event.name),
          useValue: eventModelMock,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('rejects reservation if event not found', async () => {
    const execMock = jest.fn().mockResolvedValue(null);
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    await expect(
      service.create({ eventId: 'x' }, 'u1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects reservation if event not published', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.DRAFT,
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duplicate active reservation', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.PUBLISHED,
      capacity: 10,
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'r1' }),
    });

    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects if event is full', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.PUBLISHED,
      capacity: 1,
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    reservationModelMock.countDocuments.mockResolvedValue(1);

    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates reservation when rules pass', async () => {
    const event = { _id: 'e1', status: EventStatus.PUBLISHED, capacity: 10 };
    const execMock = jest.fn().mockResolvedValue(event);
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    reservationModelMock.countDocuments.mockResolvedValue(0);
    reservationSaveMock.mockResolvedValue({ _id: 'r1' });

    const result = await service.create({ eventId: 'e1' }, 'u1');

    expect(reservationModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: event._id,
        participant: 'u1',
        status: ReservationStatus.PENDING,
      }),
    );
    expect(result).toEqual({ _id: 'r1' });
  });

  it('participant can cancel own pending reservation', async () => {
    const reservation = {
      _id: 'r1',
      participant: { toString: () => 'u1' },
      status: ReservationStatus.PENDING,
      save: jest.fn(),
    };
    const execMock = jest.fn().mockResolvedValue(reservation);
    reservationModelMock.findById.mockReturnValue({ exec: execMock });

    const result = await service.cancelByParticipant('r1', 'u1');

    expect(reservation.save).toHaveBeenCalled();
    expect(result.status).toBe(ReservationStatus.CANCELED);
  });

  it('participant cannot cancel others reservations', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'r1',
      participant: { toString: () => 'u2' },
      status: ReservationStatus.PENDING,
    });
    reservationModelMock.findById.mockReturnValue({ exec: execMock });

    await expect(
      service.cancelByParticipant('r1', 'u1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin confirm enforces capacity', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: 'r1',
      status: ReservationStatus.PENDING,
      event: 'e1',
      save: jest.fn(),
    });
    reservationModelMock.findById.mockReturnValue({ exec: execMock });
    const eventExecMock = jest.fn().mockResolvedValue({
      _id: 'e1',
      capacity: 1,
    });
    eventModelMock.findById.mockReturnValue({ exec: eventExecMock });
    reservationModelMock.countDocuments.mockResolvedValue(1);

    await expect(
      service.updateStatusAsAdmin('r1', ReservationStatus.CONFIRMED),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
