import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { analyticsRedisConfig } from '../config/analytics-redis.config';
import { DimShowtime } from './entities/dim-showtime.entity';
import { DimPatron } from './entities/dim-patron.entity';
import { DimMenuItem } from './entities/dim-menu-item.entity';
import { FactOrder } from './entities/fact-order.entity';
import { FactOrderItem } from './entities/fact-order-item.entity';

const STREAM_NAME = 'analytics:events';
const GROUP_NAME = 'analytics_workers';
const CONSUMER_NAME = `worker_${Math.random().toString(36).substring(2, 9)}`;
const BATCH_SIZE = 100;

interface OrderItemPayload {
  menuItemId: string;
  name: string;
  category: string;
  size: string | null;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
}

interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  ageGroup: string;
  gender: string;
  signupDate: string;
  theatreId: string;
  showtimeId: string;
  movieTitle: string;
  genre: string;
  screenName: string;
  showStartTime: string;
  durationMinutes: number;
  screenNumber: string;
  seatNumber: string;
  foodCost: number;
  taxes: number;
  total: number;
  status: string;
  items: OrderItemPayload[];
  createdAt: string;
}

@Injectable()
export class AnalyticsStreamWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(AnalyticsStreamWorker.name);
  private redisClient: Redis;
  private isRunning = true;

  constructor(
    @Inject(analyticsRedisConfig.KEY)
    private readonly redisConfig: { host: string; port: number },
    @InjectDataSource('analytics')
    private readonly analyticsDataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.redisClient = new Redis({
      host: this.redisConfig.host,
      port: this.redisConfig.port,
    });

    await this.setupConsumerGroup();
    // Not awaited — runs until shutdown, would block bootstrap
    void this.consumeStreamLoop();
  }

  private async setupConsumerGroup(): Promise<void> {
    try {
      await this.redisClient.xgroup(
        'CREATE',
        STREAM_NAME,
        GROUP_NAME,
        '0',
        'MKSTREAM',
      );
      this.logger.log(`Consumer group '${GROUP_NAME}' created.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('BUSYGROUP')) {
        this.logger.log(`Consumer group '${GROUP_NAME}' already exists.`);
      } else {
        throw error;
      }
    }
  }

  private async consumeStreamLoop(): Promise<void> {
    this.logger.log(`Worker ${CONSUMER_NAME} listening on ${STREAM_NAME}...`);

    while (this.isRunning) {
      try {
        const results = await this.redisClient.xreadgroup(
          'GROUP',
          GROUP_NAME,
          CONSUMER_NAME,
          'COUNT',
          BATCH_SIZE,
          'BLOCK',
          5000,
          'STREAMS',
          STREAM_NAME,
          '>',
        );

        if (!results || results.length === 0) continue;

        const streamResult = results as [string, [string, string[]][]][];
        const entries = streamResult[0][1];
        const streamIds: string[] = [];

        for (const [streamId, fields] of entries) {
          try {
            const data = this.parseStreamFields(fields);
            if (data.eventType === 'OrderCreated' && data.payload) {
              const payload = JSON.parse(data.payload) as OrderCreatedPayload;
              await this.processOrderCreated(payload);
            }
            streamIds.push(streamId);
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to process entry ${streamId}: ${msg}`);
          }
        }

        if (streamIds.length > 0) {
          await this.redisClient.xack(STREAM_NAME, GROUP_NAME, ...streamIds);
          this.logger.log(`Processed and ACKed ${streamIds.length} events.`);
        }
      } catch (error: unknown) {
        if (!this.isRunning) break;
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Stream consumption error: ${msg}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  private async processOrderCreated(
    payload: OrderCreatedPayload,
  ): Promise<void> {
    await this.analyticsDataSource.transaction(async (manager) => {
      const intermissionStartTime = this.computeIntermissionTime(
        payload.showStartTime,
        payload.durationMinutes,
      );

      await manager.upsert(
        DimShowtime,
        {
          showtimeId: payload.showtimeId,
          movieTitle: payload.movieTitle,
          genre: payload.genre,
          screenName: payload.screenName,
          showStartTime: new Date(payload.showStartTime),
          intermissionStartTime,
        },
        ['showtimeId'],
      );

      await manager.upsert(
        DimPatron,
        {
          patronId: payload.userId,
          ageBucket: payload.ageGroup,
          gender: payload.gender,
          signupDate: payload.signupDate ? new Date(payload.signupDate) : null,
        },
        ['patronId'],
      );

      for (const item of payload.items) {
        await manager.upsert(
          DimMenuItem,
          {
            itemId: item.menuItemId,
            itemName: item.name,
            category: item.category,
            size: item.size,
            unitCost: item.priceAtPurchase,
          },
          ['itemId'],
        );
      }

      await manager
        .createQueryBuilder()
        .insert()
        .into(FactOrder)
        .values({
          orderId: payload.orderId,
          patronId: payload.userId,
          showtimeId: payload.showtimeId,
          foodCost: payload.foodCost,
          taxes: payload.taxes,
          total: payload.total,
          status: payload.status,
          orderCreatedAt: new Date(payload.createdAt),
        })
        .orIgnore()
        .execute();

      for (const item of payload.items) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(FactOrderItem)
          .values({
            orderId: payload.orderId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            lineTotal: item.lineTotal,
          })
          .orIgnore()
          .execute();
      }
    });
  }

  private computeIntermissionTime(
    showStartTime: string,
    durationMinutes: number,
  ): Date | null {
    if (!durationMinutes || durationMinutes < 120) return null;
    const start = new Date(showStartTime);
    return new Date(start.getTime() + (durationMinutes / 2) * 60 * 1000);
  }

  private parseStreamFields(fields: string[]): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }
    return data;
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down analytics stream worker...');
    this.isRunning = false;
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
