import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentService } from './payment.service';
import { MenuCacheService } from '../menu/menu-cache.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';

// Polls until predicate holds, since the gateway result is handled in a
// fire-and-forget promise that initiatePayment does not await.
const waitFor = async (
  predicate: () => boolean,
  timeoutMs = 1000,
): Promise<void> => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for payment to be processed');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

/**
 * Happy-path coverage for the payment flow: a successful gateway result should
 * move the order to PLACED and the payment to SUCCESS. The mock gateway always
 * succeeds (failure path is disabled in the service), so simulateDelay=0 drives
 * the success branch deterministically.
 */
describe('PaymentService', () => {
  let service: PaymentService;

  const order = {
    id: 'order-1',
    userId: 'user-1',
    theatreId: 'theatre-1',
    total: 21,
    status: OrderStatus.PENDING_PAYMENT,
    items: [],
  };
  const paymentRecord = {
    id: 'payment-1',
    orderId: 'order-1',
    amount: 21,
    status: PaymentStatus.PENDING,
    transactionRef: null as string | null,
  };

  const menuCacheService = { invalidate: jest.fn() };

  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Order) {
        return { findOne: jest.fn().mockResolvedValue(order) };
      }
      // Payment repository — assigns an id on save like the DB would.
      return {
        save: jest.fn((payment: Payment) => {
          payment.id = 'payment-1';
          return Promise.resolve(payment);
        }),
      };
    }),
    transaction: jest.fn(
      (cb: (m: EntityManager) => Promise<unknown>) => {
        const manager = {
          findOne: jest.fn((entity: unknown) =>
            Promise.resolve(entity === Order ? order : paymentRecord),
          ),
          save: jest.fn((_entity: unknown, value: unknown) =>
            Promise.resolve(value),
          ),
        } as unknown as EntityManager;
        return cb(manager);
      },
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    order.status = OrderStatus.PENDING_PAYMENT;
    paymentRecord.status = PaymentStatus.PENDING;
    paymentRecord.transactionRef = null;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: DataSource, useValue: dataSource },
        { provide: MenuCacheService, useValue: menuCacheService },
      ],
    }).compile();

    service = moduleRef.get<PaymentService>(PaymentService);
  });

  it('should_create_pending_payment_for_order_amount', async () => {
    const payment = await service.initiatePayment('user-1', 'order-1', 0);

    expect(payment.amount).toBe(21);
    expect(payment.orderId).toBe('order-1');
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });

  it('should_place_order_and_mark_payment_success_when_gateway_succeeds', async () => {
    await service.initiatePayment('user-1', 'order-1', 0);

    await waitFor(() => order.status === OrderStatus.PLACED);

    expect(order.status).toBe(OrderStatus.PLACED);
    expect(paymentRecord.status).toBe(PaymentStatus.SUCCESS);
    expect(paymentRecord.transactionRef).toMatch(/^txn_/);
    expect(menuCacheService.invalidate).toHaveBeenCalledWith('theatre-1');
  });
});
