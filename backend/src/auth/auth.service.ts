import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole } from '../users/user.schema';
import { RefreshToken } from './refresh-token.schema';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || UserRole.PARTICIPANT,
    });

    await user.save();
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshTokenDoc = await this.refreshTokenModel.findOne({
        token: refreshTokenDto.refreshToken,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .populate('userId');

    if (!refreshTokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old refresh token
    refreshTokenDoc.isRevoked = true;
    await refreshTokenDoc.save();

    // Generate new tokens
    const user = refreshTokenDoc.userId as any;
    return this.generateTokens(user);
  }

  async logout(refreshToken: string) {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  private async generateTokens(user: User) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn
    });
    const refreshToken = crypto.randomBytes(32).toString('hex');

    // Save refresh token to database
    const refreshTokenDoc = new this.refreshTokenModel({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await refreshTokenDoc.save();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user._id ,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
