import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    return this.repository.save(payment);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.repository.findOne({ where: { orderId } });
  }
}
