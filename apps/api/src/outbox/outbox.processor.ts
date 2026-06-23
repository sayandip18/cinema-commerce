import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { OutboxRepository } from './outbox.repository';

const STREAM_NAME = 'analytics:events';
const BATCH_SIZE = 20;

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    @Inject('ANALYTICS_REDIS_CLIENT')
    private readonly analyticsRedis: Redis,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const events =
        await this.outboxRepository.findUnprocessedBatch(BATCH_SIZE);
      if (events.length === 0) return;

      this.logger.log(`Processing ${events.length} outbox events...`);

      const maxRetries = this.outboxRepository.getMaxRetryCount();
      const processedIds: string[] = [];

      for (const event of events) {
        if (event.retryCount >= maxRetries) {
          this.logger.warn(
            `Skipping event ${event.id} — exceeded max retries (${maxRetries})`,
          );
          continue;
        }

        try {
          await this.analyticsRedis.xadd(
            STREAM_NAME,
            '*',
            'eventType',
            event.eventType,
            'payload',
            JSON.stringify(event.payload),
          );
          processedIds.push(event.id);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to publish event ${event.id}: ${message}`);
          await this.outboxRepository.incrementRetryCount(event.id);
        }
      }

      await this.outboxRepository.markProcessedBatch(processedIds);

      if (processedIds.length > 0) {
        this.logger.log(
          `Published ${processedIds.length} events to ${STREAM_NAME}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Outbox processing failed: ${message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
