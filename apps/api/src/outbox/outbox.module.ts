import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './outbox.entity';
import { OutboxRepository } from './outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxModule {}
