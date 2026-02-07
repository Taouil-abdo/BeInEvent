import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('E2E - Auth + Events + Reservations', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin creates + publishes event, participant reserves, admin confirms, participant downloads ticket', async () => {
    // Register admin
    const adminReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin',
        email: `admin_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin',
      })
      .expect(201);

    const adminToken = adminReg.body.access_token;

    // Register participant
    const participantReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Participant',
        email: `participant_${Date.now()}@test.com`,
        password: 'password123',
        role: 'participant',
      })
      .expect(201);

    const participantToken = participantReg.body.access_token;

    // Admin creates event
    const createEvent = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Event',
        description: 'Testing event',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test City',
        capacity: 5,
      })
      .expect(201);

    const eventId = createEvent.body._id;

    // Admin publishes event
    await request(app.getHttpServer())
      .patch(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Participant reserves
    const reservation = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ eventId })
      .expect(201);

    const reservationId = reservation.body._id;

    // Admin confirms reservation
    await request(app.getHttpServer())
      .patch(`/reservations/${reservationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    // Participant downloads ticket
    await request(app.getHttpServer())
      .get(`/reservations/${reservationId}/ticket`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
  });
});
