import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Theatre } from '../../theatre/entities/theatre.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PLACED = 'placed',
  PREPARING = 'preparing',
  READY = 'ready',
  SEAT_DELIVERED = 'seat-delivered',
}

@Entity('orders')
@Index('IDX_ORDER_USER', ['userId'])
@Index('IDX_ORDER_THEATRE', ['theatreId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  theatreId: string;

  @ManyToOne(() => Theatre)
  @JoinColumn({ name: 'theatreId' })
  theatre: Theatre;

  @Column({ length: 50 })
  screenNumber: string;

  @Column({ length: 50 })
  seatNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  foodCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PLACED,
  })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
