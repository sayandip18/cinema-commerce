import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MenuCacheService } from '../menu/menu-cache.service';

const RESERVATION_TIMEOUT_MS = 7 * 60 * 1000;

@Injectable()
export class OrderReservationService {
  private readonly logger = new Logger(OrderReservationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly menuCacheService: MenuCacheService,
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
    const claimed = await this.dataSource.transaction(async (manager) => {
      // Atomic compare-and-swap: claim the cancellation. Only one writer can
      // transition the order out of PENDING_PAYMENT, which guards against
      // restoring stock twice (e.g. a concurrent cron tick or a late payment).
      const result = await manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.CANCELLED_DUE_TO_TIMEOUT })
        .where('id = :id', { id: order.id })
        .andWhere('status = :status', {
          status: OrderStatus.PENDING_PAYMENT,
        })
        .execute();

      // Lost the race — someone else already transitioned the order.
      if (!result.affected) {
        return false;
      }

      // We own the cancellation, so restore stock with atomic increments.
      for (const item of order.items) {
        await manager
          .createQueryBuilder()
          .update(Inventory)
          .set({ quantity: () => 'quantity + :amount' })
          .where('theatreId = :theatreId', { theatreId: order.theatreId })
          .andWhere('menuItemId = :menuItemId', {
            menuItemId: item.menuItemId,
          })
          .setParameter('amount', item.quantity)
          .execute();
      }

      return true;
    });

    if (!claimed) {
      return;
    }

    this.logger.log(`Order ${order.id} cancelled due to payment timeout`);
    await this.menuCacheService.invalidate(order.theatreId);
  }
}
