import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import * as express from 'express';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.schema';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Participant: create reservation
  @Post()
  create(
    @Body(ValidationPipe) createDto: CreateReservationDto,
    @GetUser('id') userId: string,
  ) {
    return this.reservationsService.create(createDto, userId);
  }

  // Participant: list own reservations
  @Get('me')
  findMyReservations(@GetUser('id') userId: string) {
    return this.reservationsService.findForUser(userId);
  }

  // Participant: cancel own reservation
  @Patch(':id/cancel')
  cancelMyReservation(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.reservationsService.cancelByParticipant(id, userId);
  }

  // Admin: list reservations by event
  @Get('by-event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findByEvent(@Param('eventId') eventId: string) {
    return this.reservationsService.findByEvent(eventId);
  }

  // Admin: list reservations by participant
  @Get('by-participant/:participantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findByParticipant(@Param('participantId') participantId: string) {
    return this.reservationsService.findByParticipant(participantId);
  }

  // Admin: update reservation status (confirm/refuse/cancel)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) body: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatusAsAdmin(id, body.status);
  }

  // Ticket PDF download (confirmed only)
  @Get(':id/ticket')
  @Header('Content-Type', 'application/pdf')
  async getTicket(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Res() res: express.Response,
  ) {
    const buffer = await this.reservationsService.generateTicketPdf(
      id,
      userId,
      role,
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ticket-${id}.pdf"`,
    );
    return res.send(buffer);
  }
}
