import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { jwtConfig } from '../config/jwt.config';
import { redisConfig } from '../config/redis.config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redis: ConfigType<typeof redisConfig>) => {
        return new Redis({ host: redis.host, port: redis.port });
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [JwtStrategy],
})
export class AuthModule {}
