import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { Event, EventStatus } from './event.schema';

describe('EventService', () => {
  let service: EventService;
  const saveMock = jest.fn();
  const eventModelMock: any = jest.fn().mockImplementation(() => ({
    save: saveMock,
  }));

  eventModelMock.find = jest.fn();
  eventModelMock.findById = jest.fn();
  eventModelMock.findByIdAndUpdate = jest.fn();
  eventModelMock.findByIdAndDelete = jest.fn();

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
    const execMock = jest.fn().mockResolvedValue([{ _id: '1' }]);
    eventModelMock.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({ exec: execMock }),
    });

    const result = await service.findAll();

    expect(eventModelMock.find).toHaveBeenCalledWith({
      status: EventStatus.PUBLISHED,
    });
    expect(result).toEqual([{ _id: '1' }]);
  });

  it('findOne throws if event not found', async () => {
    eventModelMock.findById.mockReturnValue({
      populate: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    });

    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('publish rejects if not owner', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
      status: EventStatus.DRAFT,
      save: jest.fn(),
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });

    await expect(service.publish('1', 'other')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('cancel rejects if not owner', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
      save: jest.fn(),
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });

    await expect(service.cancel('1', 'other')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('update converts date when provided', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    const updateExecMock = jest.fn().mockResolvedValue({ _id: '1' });
    eventModelMock.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({ exec: updateExecMock }),
    });

    await service.update('1', { date: new Date().toISOString() }, 'owner');

    expect(eventModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ date: expect.any(Date) }),
      { new: true },
    );
  });

  it('remove deletes event if owner', async () => {
    const execMock = jest.fn().mockResolvedValue({
      _id: '1',
      createdBy: { toString: () => 'owner' },
    });
    eventModelMock.findById.mockReturnValue({ exec: execMock });
    const deleteExecMock = jest.fn().mockResolvedValue({});
    eventModelMock.findByIdAndDelete.mockReturnValue({ exec: deleteExecMock });

    const result = await service.remove('1', 'owner');

    expect(result).toEqual({ message: 'Event deleted successfully' });
  });
});
