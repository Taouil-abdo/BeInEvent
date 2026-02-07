import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/user.schema';
import { RefreshToken } from './refresh-token.schema';

describe('AuthService', () => {
  let service: AuthService;

  const userSaveMock = jest.fn();
  const userModelMock: any = jest.fn().mockImplementation(() => ({
    save: userSaveMock,
  }));
  userModelMock.findOne = jest.fn();

  const refreshSaveMock = jest.fn();
  const refreshTokenModelMock: any = jest.fn().mockImplementation(() => ({
    save: refreshSaveMock,
  }));
  refreshTokenModelMock.findOne = jest.fn();
  refreshTokenModelMock.updateOne = jest.fn();

  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('access-token'),
  };
  const configServiceMock = {
    get: jest.fn().mockReturnValue('15m'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(RefreshToken.name), useValue: refreshTokenModelMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('register rejects when user exists', async () => {
    userModelMock.findOne.mockResolvedValue({ _id: 'u1' });

    await expect(
      service.register({ name: 'n', email: 'a@b.c', password: 'secret' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login rejects invalid credentials', async () => {
    userModelMock.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'a@b.c', password: 'secret' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh token rejects invalid token', async () => {
    refreshTokenModelMock.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.refreshToken({ refreshToken: 'bad' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns tokens for valid credentials', async () => {
    const user = {
      _id: 'u1',
      email: 'a@b.c',
      password: await bcrypt.hash('secret', 10),
      name: 'Name',
      role: 'participant',
    };
    userModelMock.findOne.mockResolvedValue(user);

    const result = await service.login({
      email: 'a@b.c',
      password: 'secret',
    });

    expect(result.access_token).toBe('access-token');
    expect(result.refresh_token).toBeTruthy();
    expect(result.user.email).toBe('a@b.c');
  });
});
