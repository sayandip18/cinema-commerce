import { registerAs } from '@nestjs/config';

export const analyticsRedisConfig = registerAs('analyticsRedis', () => ({
  host: process.env.ANALYTICS_REDIS_HOST || 'localhost',
  port: parseInt(process.env.ANALYTICS_REDIS_PORT || '6380', 10),
}));
