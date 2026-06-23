import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './outbox.entity';
import { OutboxRepository } from './outbox.repository';
import { OutboxProcessor } from './outbox.processor';
import { AnalyticsRedisModule } from '../redis/analytics-redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent]), AnalyticsRedisModule],
  providers: [OutboxRepository, OutboxProcessor],
  exports: [OutboxRepository],
})
export class OutboxModule {}
