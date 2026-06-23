import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsStreamWorker } from './analytics-stream.worker';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DimShowtime } from './entities/dim-showtime.entity';
import { DimPatron } from './entities/dim-patron.entity';
import { DimMenuItem } from './entities/dim-menu-item.entity';
import { FactOrder } from './entities/fact-order.entity';
import { FactOrderItem } from './entities/fact-order-item.entity';
import { analyticsRedisConfig } from '../config/analytics-redis.config';

@Module({
  imports: [
    ConfigModule.forFeature(analyticsRedisConfig),
    TypeOrmModule.forFeature(
      [DimShowtime, DimPatron, DimMenuItem, FactOrder, FactOrderItem],
      'analytics',
    ),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsStreamWorker, AnalyticsService],
})
export class AnalyticsModule {}
