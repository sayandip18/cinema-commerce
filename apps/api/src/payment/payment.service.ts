import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MenuCacheService } from '../menu/menu-cache.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly menuCacheService: MenuCacheService,
  ) {}

  async initiatePayment(
    userId: string,
    orderId: string,
    simulateDelay?: number,
  ): Promise<Payment> {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Order ${orderId} is not awaiting payment (status: ${order.status})`,
      );
    }

    const payment = new Payment();
    payment.orderId = orderId;
    payment.amount = order.total;
    payment.status = PaymentStatus.PENDING;
    const saved = await this.dataSource.getRepository(Payment).save(payment);

    void this.processGatewayAsync(saved.id, orderId, simulateDelay);

    return saved;
  }

  private async processGatewayAsync(
    paymentId: string,
    orderId: string,
    simulateDelay?: number,
  ): Promise<void> {
    let gatewaySuccess = false;
    let transactionId: string | undefined;

    try {
      const result = await this.mockPaymentGateway(simulateDelay);
      gatewaySuccess = true;
      transactionId = result.transactionId;
    } catch {
      // gateway failed — gatewaySuccess stays false
    }

    try {
      await this.handlePaymentResult(paymentId, orderId, {
        success: gatewaySuccess,
        transactionId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle payment result for order ${orderId}: ${error}`,
      );
    }
  }

  private async handlePaymentResult(
    paymentId: string,
    orderId: string,
    result: { success: boolean; transactionId?: string },
  ): Promise<void> {
    let theatreId: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: { items: true },
        // lock: { mode: 'pessimistic_write' },
      });

      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
      });

      if (!order || !payment) return;
      theatreId = order.theatreId;

      // happy path
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        if (result.success) {
          payment.status = PaymentStatus.SUCCESS;
          payment.transactionRef = result.transactionId ?? null;
          order.status = OrderStatus.PLACED;
        } else {
          payment.status = PaymentStatus.FAILED;
          order.status = OrderStatus.CANCELLED;
          await this.restoreStock(manager, order);
        }
        // cron expired the order due to timeout
      } else if (order.status === OrderStatus.CANCELLED_DUE_TO_TIMEOUT) {
        if (result.success) {
          const reacquired = await this.tryReacquireStock(manager, order);
          if (reacquired) {
            payment.status = PaymentStatus.SUCCESS;
            payment.transactionRef = result.transactionId ?? null;
            order.status = OrderStatus.PLACED;
            this.logger.log(
              `Late payment for order ${orderId} succeeded — stock re-acquired`,
            );
          } else {
            payment.status = PaymentStatus.REFUNDED;
            payment.transactionRef = result.transactionId ?? null;
            this.logger.warn(
              `Late payment for order ${orderId} refunded — insufficient stock`,
            );
          }
        } else {
          payment.status = PaymentStatus.FAILED;
        }
      } else {
        this.logger.warn(
          `Payment result for order ${orderId} arrived in unexpected status: ${order.status}`,
        );
        return;
      }

      await manager.save(Order, order);
      await manager.save(Payment, payment);
    });

    if (theatreId) {
      await this.menuCacheService.invalidate(theatreId);
    }
  }

  private async restoreStock(
    manager: EntityManager,
    order: Order,
  ): Promise<void> {
    for (const item of order.items) {
      await manager
        .createQueryBuilder()
        .update(Inventory)
        .set({ quantity: () => 'quantity + :amount' })
        .where('theatreId = :theatreId', { theatreId: order.theatreId })
        .andWhere('menuItemId = :menuItemId', { menuItemId: item.menuItemId })
        .setParameter('amount', item.quantity)
        .execute();
    }
  }

  private async tryReacquireStock(
    manager: EntityManager,
    order: Order,
  ): Promise<boolean> {
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

      if (!inventory || inventory.quantity < item.quantity) {
        return false;
      }
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
        inventory.quantity -= item.quantity;
        await manager.save(Inventory, inventory);
      }
    }

    return true;
  }

  private async mockPaymentGateway(
    simulateDelay?: number,
  ): Promise<{ transactionId: string }> {
    const delay = simulateDelay ?? Math.random() * 800 + 400;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // if (Math.random() < 0.05) {
    //   throw new Error('PAYMENT_FAILED');
    // }

    return {
      transactionId: `txn_${Math.random().toString(36).substring(2, 11)}`,
    };
  }
}
