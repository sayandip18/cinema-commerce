import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutboxEvent } from './outbox.entity';

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly repository: Repository<OutboxEvent>,
  ) {}

  async saveWithManager(
    manager: EntityManager,
    event: OutboxEvent,
  ): Promise<OutboxEvent> {
    return manager.save(OutboxEvent, event);
  }
}
