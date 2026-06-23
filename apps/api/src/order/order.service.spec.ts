import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { MenuRepository } from '../menu/menu.repository';
import { MenuCacheService } from '../menu/menu-cache.service';
import { UserRepository } from '../user/user.repository';
import { ShowtimeService } from '../showtime/showtime.service';
import { OutboxRepository } from '../outbox/outbox.repository';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Happy-path coverage for placing an order. Every dependency is mocked, so this
 * verifies OrderService's own logic: pricing, status, inventory decrement and
 * cache invalidation — not the database.
 */
describe('OrderService', () => {
  let service: OrderService;

  const orderRepository = {
    findByIdempotencyKey: jest.fn(),
    saveWithManager: jest.fn(),
  };
  const inventoryRepository = {
    decrementQuantity: jest.fn(),
  };
  const menuRepository = {
    findById: jest.fn(),
  };
  const menuCacheService = {
    invalidate: jest.fn(),
  };
  const userRepository = {
    findById: jest.fn(),
  };
  const showtimeService = {
    findByIdWithMovie: jest.fn(),
  };
  const outboxRepository = {
    saveWithManager: jest.fn(),
  };

  // Runs the transaction callback with a stub manager. The happy path never
  // touches the manager directly (all DB work goes through the mocked repos).
  const manager = { findOne: jest.fn() } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(
      (cb: (m: EntityManager) => Promise<unknown>) => cb(manager),
    ),
  };

  const dto: CreateOrderDto = {
    theatreId: 'theatre-1',
    showtimeId: 'showtime-1',
    screenNumber: '3',
    seatNumber: 'A12',
    items: [{ menuItemId: 'menu-1', quantity: 2 }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      ageGroup: '25-34',
      gender: 'male',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });
    showtimeService.findByIdWithMovie.mockResolvedValue({
      id: 'showtime-1',
      theatreId: 'theatre-1',
      screen: 'Screen 3',
      startTime: new Date('2026-06-23T18:00:00.000Z'),
      movie: { title: 'Inception', genre: 'sci-fi', durationMinutes: 148 },
    });
    menuRepository.findById.mockResolvedValue({
      id: 'menu-1',
      name: 'Large Popcorn',
      category: 'snack',
      size: 'large',
      basePrice: '10.00',
    });
    orderRepository.findByIdempotencyKey.mockResolvedValue(null);
    orderRepository.saveWithManager.mockImplementation(
      (_m: EntityManager, order: Order) => {
        order.id = 'order-1';
        return Promise.resolve(order);
      },
    );
    inventoryRepository.decrementQuantity.mockResolvedValue(true);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: InventoryRepository, useValue: inventoryRepository },
        { provide: MenuRepository, useValue: menuRepository },
        { provide: MenuCacheService, useValue: menuCacheService },
        { provide: UserRepository, useValue: userRepository },
        { provide: ShowtimeService, useValue: showtimeService },
        { provide: OutboxRepository, useValue: outboxRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get<OrderService>(OrderService);
  });

  it('should_place_order_with_correct_totals_and_pending_status', async () => {
    const order = await service.placeOrder('user-1', dto);

    // 2 x 10.00 = 20 food, 5% tax = 1, total = 21
    expect(order.foodCost).toBe(20);
    expect(order.taxes).toBe(1);
    expect(order.total).toBe(21);
    expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(order.items).toHaveLength(1);
  });

  it('should_decrement_inventory_and_invalidate_cache_when_order_is_placed', async () => {
    await service.placeOrder('user-1', dto);

    expect(inventoryRepository.decrementQuantity).toHaveBeenCalledWith(
      manager,
      'theatre-1',
      'menu-1',
      2,
    );
    expect(outboxRepository.saveWithManager).toHaveBeenCalledTimes(1);
    expect(menuCacheService.invalidate).toHaveBeenCalledWith('theatre-1');
  });
});
