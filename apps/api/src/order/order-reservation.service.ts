import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import Redis from 'ioredis';
import { Order, OrderStatus } from './entities/order.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

const RESERVATION_TIMEOUT_MS = 7 * 60 * 1000;

@Injectable()
export class OrderReservationService {
  private readonly logger = new Logger(OrderReservationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations(): Promise<void> {
    const cutoff = new Date(Date.now() - RESERVATION_TIMEOUT_MS);

    const expiredOrders = await this.dataSource.getRepository(Order).find({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        createdAt: LessThan(cutoff),
      },
      relations: { items: true },
    });

    for (const order of expiredOrders) {
      try {
        await this.cancelAndRestoreStock(order);
      } catch (error) {
        this.logger.error(
          `Failed to cancel expired order ${order.id}: ${error}`,
        );
      }
    }
  }

  async cancelAndRestoreStock(order: Order): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Order, {
        where: { id: order.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked || locked.status !== OrderStatus.PENDING_PAYMENT) {
        return;
      }

      for (const item of order.items) {
        const inventory = await manager
          .createQueryBuilder(Inventory, 'inventory')
          .setLock('pessimistic_write')
          .where('inventory.theatreId = :theatreId', {
            theatreId: order.theatreId,
          })
          .andWhere('inventory.menuItemId = :menuItemId', {
            menuItemId: item.menuItemId,
          })
          .getOne();

        if (inventory) {
          inventory.quantity += item.quantity;
          await manager.save(Inventory, inventory);
        }
      }

      locked.status = OrderStatus.CANCELLED_DUE_TO_TIMEOUT;
      await manager.save(Order, locked);
    });

    await this.redis.del(`reservation:${order.id}`);
    this.logger.log(`Order ${order.id} cancelled due to payment timeout`);
  }
}
