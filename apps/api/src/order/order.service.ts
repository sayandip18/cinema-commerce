import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './order.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { MenuRepository } from '../menu/menu.repository';
import { CreateOrderDto } from './dto/create-order.dto';

const TAX_RATE = 0.05;
const RESERVATION_TTL_SECONDS = 420; // 7 minutes

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly menuRepository: MenuRepository,
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async placeOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    if (dto.idempotencyKey) {
      const existing = await this.orderRepository.findByIdempotencyKey(
        userId,
        dto.idempotencyKey,
      );
      if (existing) {
        return existing;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let foodCost = 0;
      const orderItems: OrderItem[] = [];

      for (const item of dto.items) {
        const menuItem = await this.menuRepository.findById(item.menuItemId);
        if (!menuItem) {
          throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
        }

        const inventory =
          await this.inventoryRepository.findByTheatreAndMenuItemForUpdate(
            manager,
            dto.theatreId,
            item.menuItemId,
          );

        if (!inventory || inventory.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${menuItem.name}". Available: ${inventory?.quantity ?? 0}, requested: ${item.quantity}`,
          );
        }

        inventory.quantity -= item.quantity;
        await this.inventoryRepository.saveWithManager(manager, inventory);

        const lineTotal = Number(menuItem.basePrice) * item.quantity;
        foodCost += lineTotal;

        const orderItem = new OrderItem();
        orderItem.menuItemId = item.menuItemId;
        orderItem.quantity = item.quantity;
        orderItem.priceAtPurchase = Number(menuItem.basePrice);
        orderItems.push(orderItem);
      }

      const taxes = Math.round(foodCost * TAX_RATE * 100) / 100;
      const total = Math.round((foodCost + taxes) * 100) / 100;

      const order = new Order();
      order.userId = userId;
      order.theatreId = dto.theatreId;
      order.screenNumber = dto.screenNumber;
      order.seatNumber = dto.seatNumber;
      order.foodCost = foodCost;
      order.taxes = taxes;
      order.total = total;
      order.status = OrderStatus.PENDING_PAYMENT;
      order.idempotencyKey = dto.idempotencyKey ?? null;
      order.items = orderItems;

      const saved = await this.orderRepository.saveWithManager(manager, order);

      const reservationData = JSON.stringify(
        dto.items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      );
      await this.redis.set(
        `reservation:${saved.id}`,
        reservationData,
        'EX',
        RESERVATION_TTL_SECONDS,
      );

      return saved;
    });
  }

  async getOrderById(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }
}
