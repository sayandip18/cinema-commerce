import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig } from '../config/redis.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redis: ConfigType<typeof redisConfig>) => {
        return new Redis({ host: redis.host, port: redis.port });
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
