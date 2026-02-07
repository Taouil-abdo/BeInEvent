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
import { Model } from 'mongoose';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const reservationSaveMock = jest.fn();
  const reservationModelMock = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  }) as unknown as jest.Mocked<Model<Reservation>>;
  (reservationModelMock as unknown as jest.Mock).mockImplementation(() => ({
    save: reservationSaveMock,
  }));

  const eventModelMock = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<Model<Event>>;

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
    const execMock = jest
      .fn<Promise<Event | null>, []>()
      .mockResolvedValue(null);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    await expect(service.create({ eventId: 'x' }, 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects reservation if event not published', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.DRAFT,
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duplicate active reservation', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.PUBLISHED,
      capacity: 10,
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'r1' }),
    } as any);

    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects if event is full', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: 'e1',
      status: EventStatus.PUBLISHED,
      capacity: 1,
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);
    reservationModelMock.countDocuments.mockResolvedValue(1);

    await expect(
      service.create({ eventId: 'e1' }, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates reservation when rules pass', async () => {
    const eventId = 'e1';
    const event = {
      _id: eventId,
      status: EventStatus.PUBLISHED,
      capacity: 10,
    } as unknown as Event;
    const execMock = jest
      .fn<Promise<Event | null>, []>()
      .mockResolvedValue(event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    reservationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);
    reservationModelMock.countDocuments.mockResolvedValue(0);
    reservationSaveMock.mockResolvedValue({ _id: 'r1' });

    const result = await service.create({ eventId: 'e1' }, 'u1');

    expect(reservationModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: eventId,
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
    const execMock = jest
      .fn<Promise<Reservation | null>, []>()
      .mockResolvedValue(reservation as unknown as Reservation);
    reservationModelMock.findById.mockReturnValue({ exec: execMock } as any);

    const result = await service.cancelByParticipant('r1', 'u1');

    expect(reservation.save).toHaveBeenCalled();
    expect(result.status).toBe(ReservationStatus.CANCELED);
  });

  it('participant cannot cancel others reservations', async () => {
    const execMock = jest
      .fn<Promise<Reservation | null>, []>()
      .mockResolvedValue({
        _id: 'r1',
        participant: { toString: () => 'u2' },
        status: ReservationStatus.PENDING,
      } as unknown as Reservation);
    reservationModelMock.findById.mockReturnValue({ exec: execMock } as any);

    await expect(
      service.cancelByParticipant('r1', 'u1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin confirm enforces capacity', async () => {
    const execMock = jest
      .fn<Promise<Reservation | null>, []>()
      .mockResolvedValue({
        _id: 'r1',
        status: ReservationStatus.PENDING,
        event: 'e1',
        save: jest.fn(),
      } as unknown as Reservation);
    reservationModelMock.findById.mockReturnValue({ exec: execMock } as any);
    const eventExecMock = jest
      .fn<Promise<Event | null>, []>()
      .mockResolvedValue({
        _id: 'e1',
        capacity: 1,
      } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: eventExecMock } as any);
    reservationModelMock.countDocuments.mockResolvedValue(1);

    await expect(
      service.updateStatusAsAdmin('r1', ReservationStatus.CONFIRMED),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
