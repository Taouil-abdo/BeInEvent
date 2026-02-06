import { IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  eventId: string;
}
