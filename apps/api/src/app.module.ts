import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { analyticsRedisConfig } from './config/analytics-redis.config';
import { analyticsDbConfig } from './config/analytics-db.config';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TheatreModule } from './theatre/theatre.module';
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { RefillModule } from './refill/refill.module';
import { MovieModule } from './movie/movie.module';
import { ShowtimeModule } from './showtime/showtime.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DimShowtime } from './analytics/entities/dim-showtime.entity';
import { DimPatron } from './analytics/entities/dim-patron.entity';
import { DimMenuItem } from './analytics/entities/dim-menu-item.entity';
import { FactOrder } from './analytics/entities/fact-order.entity';
import { FactOrderItem } from './analytics/entities/fact-order-item.entity';
import { User } from './user/entities/user.entity';
import { Theatre } from './theatre/entities/theatre.entity';
import { MenuItem } from './menu/entities/menu-item.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { Payment } from './payment/entities/payment.entity';
import { Movie } from './movie/entities/movie.entity';
import { Showtime } from './showtime/entities/showtime.entity';
import { OutboxEvent } from './outbox/outbox.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        analyticsRedisConfig,
        analyticsDbConfig,
      ],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres' as const,
        host: db.host,
        port: db.port,
        database: db.database,
        username: db.username,
        password: db.password,
        entities: [
          User,
          Theatre,
          MenuItem,
          Inventory,
          Order,
          OrderItem,
          Payment,
          Movie,
          Showtime,
          OutboxEvent,
        ],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'analytics',
      inject: [analyticsDbConfig.KEY],
      useFactory: (db: ConfigType<typeof analyticsDbConfig>) => ({
        type: 'postgres' as const,
        host: db.host,
        port: db.port,
        database: db.database,
        username: db.username,
        password: db.password,
        entities: [
          DimShowtime,
          DimPatron,
          DimMenuItem,
          FactOrder,
          FactOrderItem,
        ],
        synchronize: true,
      }),
    }),
    UserModule,
    AuthModule,
    TheatreModule,
    MenuModule,
    InventoryModule,
    OrderModule,
    PaymentModule,
    RefillModule,
    MovieModule,
    ShowtimeModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
