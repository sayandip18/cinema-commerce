import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('fact_order_items')
export class FactOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  menuItemId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtPurchase: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;
}
