import { IsEnum } from 'class-validator';
import { ReservationStatus } from '../reservations.schema';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
