import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './order.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MenuRepository } from '../menu/menu.repository';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { MenuCacheService } from '../menu/menu-cache.service';
import { UserRepository } from '../user/user.repository';
import { ShowtimeService } from '../showtime/showtime.service';
import { Showtime } from '../showtime/entities/showtime.entity';
import { OutboxRepository } from '../outbox/outbox.repository';
import { OutboxEvent } from '../outbox/outbox.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const TAX_RATE = 0.05;

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly menuRepository: MenuRepository,
    private readonly menuCacheService: MenuCacheService,
    private readonly userRepository: UserRepository,
    private readonly showtimeService: ShowtimeService,
    private readonly outboxRepository: OutboxRepository,
    private readonly dataSource: DataSource,
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

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const showtime: Showtime | null =
      await this.showtimeService.findByIdWithMovie(dto.showtimeId);
    if (!showtime) {
      throw new NotFoundException(`Showtime ${dto.showtimeId} not found`);
    }
    if (showtime.theatreId !== dto.theatreId) {
      throw new BadRequestException(
        'Showtime does not belong to the specified theatre',
      );
    }

    // NOTE: Resolve menu items before opening the transaction. These are read-only
    // reference lookups; fetching them inside the transaction would check out a
    // second pool connection while the first is held, which deadlocks the pool
    // under burst load and needlessly extends the inventory row lock.
    const menuItems = new Map<string, MenuItem>();
    for (const item of dto.items) {
      const menuItem = await this.menuRepository.findById(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
      }
      menuItems.set(item.menuItemId, menuItem);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      let foodCost = 0;
      const orderItems: OrderItem[] = [];
      const itemSnapshots: Record<string, unknown>[] = [];

      // Build line items and totals from the pre-fetched menu data. No DB work
      // here and — crucially — no inventory lock is taken yet.
      for (const item of dto.items) {
        const menuItem = menuItems.get(item.menuItemId)!;

        const lineTotal = Number(menuItem.basePrice) * item.quantity;
        foodCost += lineTotal;

        const orderItem = new OrderItem();
        orderItem.menuItemId = item.menuItemId;
        orderItem.quantity = item.quantity;
        orderItem.priceAtPurchase = Number(menuItem.basePrice);
        orderItems.push(orderItem);

        itemSnapshots.push({
          menuItemId: item.menuItemId,
          name: menuItem.name,
          category: menuItem.category,
          size: menuItem.size,
          quantity: item.quantity,
          priceAtPurchase: Number(menuItem.basePrice),
          lineTotal,
        });
      }

      const taxes = Math.round(foodCost * TAX_RATE * 100) / 100;
      const total = Math.round((foodCost + taxes) * 100) / 100;

      const order = new Order();
      order.userId = userId;
      order.theatreId = dto.theatreId;
      order.showtimeId = dto.showtimeId;
      order.screenNumber = dto.screenNumber;
      order.seatNumber = dto.seatNumber;
      order.foodCost = foodCost;
      order.taxes = taxes;
      order.total = total;
      order.status = OrderStatus.PENDING_PAYMENT;
      order.idempotencyKey = dto.idempotencyKey ?? null;
      order.items = orderItems;

      const saved = await this.orderRepository.saveWithManager(manager, order);

      const outboxEvent = new OutboxEvent();
      outboxEvent.aggregateType = 'Order';
      outboxEvent.aggregateId = saved.id;
      outboxEvent.eventType = 'OrderCreated';
      outboxEvent.payload = {
        orderId: saved.id,
        userId,
        ageGroup: user.ageGroup,
        gender: user.gender,
        signupDate: user.createdAt.toISOString(),
        theatreId: dto.theatreId,
        showtimeId: dto.showtimeId,
        movieTitle: showtime.movie.title,
        genre: showtime.movie.genre,
        screenName: showtime.screen,
        showStartTime: showtime.startTime.toISOString(),
        durationMinutes: showtime.movie.durationMinutes,
        screenNumber: dto.screenNumber,
        seatNumber: dto.seatNumber,
        foodCost,
        taxes,
        total,
        status: OrderStatus.PENDING_PAYMENT,
        items: itemSnapshots,
        createdAt: new Date().toISOString(),
      };
      await this.outboxRepository.saveWithManager(manager, outboxEvent);

      // Reserve stock last, immediately before commit, so the inventory row lock
      // is held for the shortest possible window — that hold time is what bounds
      // tail latency when a burst contends on a hot item. Decrement in a stable
      // key order so concurrent multi-item orders can't deadlock against each
      // other. A failed reservation throws, rolling back the order and outbox
      // inserts above.
      const itemsInLockOrder = [...dto.items].sort((a, b) =>
        a.menuItemId.localeCompare(b.menuItemId),
      );
      for (const item of itemsInLockOrder) {
        const updated = await this.inventoryRepository.decrementQuantity(
          manager,
          dto.theatreId,
          item.menuItemId,
          item.quantity,
        );

        if (!updated) {
          const menuItem = menuItems.get(item.menuItemId)!;
          const inventory = await manager.findOne(Inventory, {
            where: { theatreId: dto.theatreId, menuItemId: item.menuItemId },
          });
          throw new BadRequestException(
            `Insufficient stock for "${menuItem.name}". Available: ${inventory?.quantity ?? 0}, requested: ${item.quantity}`,
          );
        }
      }

      return saved;
    });

    await this.menuCacheService.invalidate(dto.theatreId);

    return result;
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
