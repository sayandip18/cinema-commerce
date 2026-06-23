import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../../config/database.config';
import { User } from '../../user/entities/user.entity';
import { Theatre } from '../../theatre/entities/theatre.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Order } from '../../order/entities/order.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Movie } from '../../movie/entities/movie.entity';
import { Showtime } from '../../showtime/entities/showtime.entity';
import { OutboxEvent } from '../../outbox/outbox.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
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
  ],
})
export class SeedModule {}
