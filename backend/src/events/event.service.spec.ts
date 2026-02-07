import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { Event, EventStatus } from './event.schema';
import { Model } from 'mongoose';

describe('EventService', () => {
  let service: EventService;
  const saveMock = jest.fn();
  const eventModelMock = Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }) as unknown as jest.Mocked<Model<Event>>;

  (eventModelMock as unknown as jest.Mock).mockImplementation(() => ({
    save: saveMock,
  }));

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModelMock,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('creates an event with DRAFT status and creator', async () => {
    const dto = {
      title: 'Test',
      date: new Date().toISOString(),
      capacity: 10,
    };
    const created = { _id: '1', ...dto, status: EventStatus.DRAFT };
    saveMock.mockResolvedValue(created);

    const result = await service.create(dto, 'user-1');

    expect(eventModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: dto.title,
        capacity: dto.capacity,
        status: EventStatus.DRAFT,
        createdBy: 'user-1',
      }),
    );
    expect(result).toEqual(created);
  });

  it('findAll returns only published events', async () => {
    const execMock = jest
      .fn<Promise<Event[]>, []>()
      .mockResolvedValue([{ _id: '1' } as unknown as Event]);
    eventModelMock.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ exec: execMock }),
    } as any);

    const result = await service.findAll();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const findArgs = (eventModelMock.find as jest.Mock).mock.calls[0]?.[0];
    expect(findArgs).toEqual({ status: EventStatus.PUBLISHED });
    expect(result).toEqual([{ _id: '1' }]);
  });

  it('findOne throws if event not found', async () => {
    eventModelMock.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn<Promise<Event | null>, []>().mockResolvedValue(null),
      }),
    } as any);

    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('publish rejects if not owner', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
      status: EventStatus.DRAFT,
      save: jest.fn(),
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);

    await expect(service.publish('1', 'other')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('cancel rejects if not owner', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
      save: jest.fn(),
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);

    await expect(service.cancel('1', 'other')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('update converts date when provided', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    const updateExecMock = jest
      .fn<Promise<Event | null>, []>()
      .mockResolvedValue({ _id: '1' } as unknown as Event);
    eventModelMock.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({ exec: updateExecMock }),
    } as any);

    await service.update('1', { date: new Date().toISOString() }, 'owner');

    const updateCalls = (eventModelMock.findByIdAndUpdate as jest.Mock).mock
      .calls as Array<[string, { date?: Date }]>;
    const updatePayload = updateCalls[0]?.[1];
    expect(updatePayload.date).toBeInstanceOf(Date);
  });

  it('remove deletes event if owner', async () => {
    const execMock = jest.fn<Promise<Event | null>, []>().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
    } as unknown as Event);
    eventModelMock.findById.mockReturnValue({ exec: execMock } as any);
    const deleteExecMock = jest
      .fn<Promise<Event | null>, []>()
      .mockResolvedValue({} as Event);
    eventModelMock.findByIdAndDelete.mockReturnValue({
      exec: deleteExecMock,
    } as any);

    const result = await service.remove('1', 'owner');

    expect(result).toEqual({ message: 'Event deleted successfully' });
  });
});
