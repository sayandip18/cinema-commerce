import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { OutboxEvent } from './outbox.entity';

const MAX_RETRY_COUNT = 5;

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

  async findUnprocessedBatch(batchSize: number): Promise<OutboxEvent[]> {
    return this.repository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: batchSize,
    });
  }

  async markProcessedBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repository.update({ id: In(ids) }, { processed: true });
  }

  async incrementRetryCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'retryCount', 1);
  }

  getMaxRetryCount(): number {
    return MAX_RETRY_COUNT;
  }
}
