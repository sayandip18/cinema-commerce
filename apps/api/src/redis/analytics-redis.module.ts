import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { analyticsRedisConfig } from '../config/analytics-redis.config';

@Module({
  imports: [ConfigModule.forFeature(analyticsRedisConfig)],
  providers: [
    {
      provide: 'ANALYTICS_REDIS_CLIENT',
      useFactory: (config: ConfigType<typeof analyticsRedisConfig>) => {
        return new Redis({ host: config.host, port: config.port });
      },
      inject: [analyticsRedisConfig.KEY],
    },
  ],
  exports: ['ANALYTICS_REDIS_CLIENT'],
})
export class AnalyticsRedisModule {}
