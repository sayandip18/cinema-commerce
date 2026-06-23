import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: { items: { menuItem: true } },
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.repository.find({
      where: { userId },
      relations: { items: { menuItem: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: { userId, idempotencyKey },
      relations: { items: true },
    });
  }

  async saveWithManager(manager: EntityManager, order: Order): Promise<Order> {
    return manager.save(Order, order);
  }
}
