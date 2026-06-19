import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { OrderReservationService } from './order-reservation.service';
import { OrderController } from './order.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    InventoryModule,
    MenuModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, OrderReservationService],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
