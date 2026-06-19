import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TheatreModule } from './theatre/theatre.module';
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrderModule } from './order/order.module';
import { RefillModule } from './refill/refill.module';
import { User } from './user/entities/user.entity';
import { Theatre } from './theatre/entities/theatre.entity';
import { MenuItem } from './menu/entities/menu-item.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres' as const,
        host: db.host,
        port: db.port,
        database: db.database,
        username: db.username,
        password: db.password,
        entities: [User, Theatre, MenuItem, Inventory, Order, OrderItem],
        synchronize: true,
      }),
    }),
    UserModule,
    AuthModule,
    TheatreModule,
    MenuModule,
    InventoryModule,
    OrderModule,
    RefillModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
