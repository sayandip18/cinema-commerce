import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('fact_orders')
export class FactOrder {
  @PrimaryColumn('uuid')
  orderId: string;

  @Column('uuid')
  patronId: string;

  @Column('uuid')
  showtimeId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  foodCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'timestamptz' })
  orderCreatedAt: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  ingestedAt: Date;
}
