import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('outbox')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  aggregateType: string;

  @Column()
  aggregateId: string;

  @Column()
  eventType: string;

  @Column('jsonb')
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  processed: boolean;
}
