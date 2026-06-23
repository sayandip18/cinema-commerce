import { registerAs } from '@nestjs/config';

export const analyticsDbConfig = registerAs('analyticsDb', () => ({
  host: process.env.ANALYTICS_DB_HOST || 'localhost',
  port: parseInt(process.env.ANALYTICS_DB_PORT || '5433', 10),
  database: process.env.ANALYTICS_DB_NAME || 'analytics_db',
  username: process.env.ANALYTICS_DB_USER || 'analytics_user',
  password: process.env.ANALYTICS_DB_PASSWORD || 'analytics_pass',
}));
