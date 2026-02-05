import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Event } from '../events/event.schema';
import { User } from '../users/user.schema';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REFUSED = 'REFUSED',
  CANCELED = 'CANCELED',
}

@Schema({ timestamps: true })
export class Reservation extends Document {
  @Prop({ type: Types.ObjectId, ref: Event.name, required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  participant: Types.ObjectId;

  @Prop({
    required: true,
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
