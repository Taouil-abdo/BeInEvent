import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    const event = new this.eventModel({
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: EventStatus.DRAFT,
      createdBy: userId,
    });
    return event.save();
  }

  async findAll() {
    // Public list: only PUBLISHED and not CANCELED
    return this.eventModel
      .find({ status: EventStatus.PUBLISHED })
      .populate('createdBy', 'name email')
      .exec();
  }

  async findOne(id: string) {
    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async publish(id: string, userId: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only publish your own events');
    }
    if (event.status === EventStatus.CANCELED) {
      throw new ForbiddenException('Canceled events cannot be published');
    }
    event.status = EventStatus.PUBLISHED;
    await event.save();
    return event;
  }

  async cancel(id: string, userId: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own events');
    }
    event.status = EventStatus.CANCELED;
    await event.save();
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }
    const updateData: any = { ...updateEventDto };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    return this.eventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .exec();
  }

  async remove(id: string, userId: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }
    await this.eventModel.findByIdAndDelete(id).exec();
    return { message: 'Event deleted successfully' };
  }
}
