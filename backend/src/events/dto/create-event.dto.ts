import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
