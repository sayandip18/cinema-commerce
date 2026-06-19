import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { jwtConfig } from '../config/jwt.config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

function stripPassword(user: User): Omit<User, 'password'> {
  const { password, ...rest } = user;
  void password;
  return rest;
}

const OTP_TTL_SECONDS = 300; // 5 minutes
const MOCK_OTP = '123456';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AccessTokenPayload {
  sub: string;
  phone: string;
}

interface SignupTokenPayload {
  phone: string;
  purpose: 'signup';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  async sendOtp(phone: string): Promise<void> {
    const otpKey = `otp:${phone}`;
    await this.redis.set(otpKey, MOCK_OTP, 'EX', OTP_TTL_SECONDS);
  }

  async verifyOtpForSignup(
    phone: string,
    otp: string,
  ): Promise<{ signupToken: string }> {
    await this.validateOtp(phone, otp);

    const exists = await this.userService.existsByPhone(phone);
    if (exists) {
      throw new ConflictException('User with this phone number already exists');
    }

    const signupToken = this.jwtService.sign(
      { phone, purpose: 'signup' } satisfies SignupTokenPayload,
      { secret: this.jwt.accessSecret, expiresIn: '10m' },
    );

    return { signupToken };
  }

  async completeSignup(
    signupToken: string,
    name: string,
    email?: string,
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    let payload: SignupTokenPayload;
    try {
      payload = this.jwtService.verify<SignupTokenPayload>(signupToken, {
        secret: this.jwt.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired signup token');
    }

    if (payload.purpose !== 'signup') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const exists = await this.userService.existsByPhone(payload.phone);
    if (exists) {
      throw new ConflictException('User with this phone number already exists');
    }

    const user = await this.userService.createUser({
      name,
      phone: payload.phone,
      email,
    });

    const tokens = await this.generateTokens(user);

    return { user: stripPassword(user), tokens };
  }

  async verifyOtpForSignin(
    phone: string,
    otp: string,
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    await this.validateOtp(phone, otp);

    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('No account found with this phone number');
    }

    const tokens = await this.generateTokens(user);

    return { user: stripPassword(user), tokens };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const tokenKey = `refresh:${refreshToken}`;
    const userId = await this.redis.get(tokenKey);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Single-use: delete immediately
    await this.redis.del(tokenKey);

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  private async validateOtp(phone: string, otp: string): Promise<void> {
    const otpKey = `otp:${phone}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not sent');
    }

    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.redis.del(otpKey);
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: AccessTokenPayload = { sub: user.id, phone: user.phone };

    const accessToken = this.jwtService.sign(
      { ...payload } as Record<string, unknown>,
      {
        secret: this.jwt.accessSecret,
        expiresIn: this.jwt.accessExpiry as `${number}m`,
      },
    );

    const refreshToken = randomUUID();
    const refreshKey = `refresh:${refreshToken}`;
    await this.redis.set(refreshKey, user.id, 'EX', REFRESH_TOKEN_TTL_SECONDS);

    return { accessToken, refreshToken };
  }
}
