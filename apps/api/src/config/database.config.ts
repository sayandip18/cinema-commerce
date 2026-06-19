import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.PATRON_DB_HOST || 'localhost',
  port: parseInt(process.env.PATRON_DB_PORT || '5432', 10),
  database: process.env.PATRON_DB_NAME || 'patron_db',
  username: process.env.PATRON_DB_USER || 'patron_user',
  password: process.env.PATRON_DB_PASSWORD || 'patron_pass',
}));
