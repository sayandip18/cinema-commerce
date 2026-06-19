import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  VersionColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Theatre } from '../../theatre/entities/theatre.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';

@Entity('inventory')
@Index('IDX_INVENTORY_THEATRE_MENUITEM', ['theatreId', 'menuItemId'], {
  unique: true,
})
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  theatreId: string;

  @ManyToOne(() => Theatre)
  @JoinColumn({ name: 'theatreId' })
  theatre: Theatre;

  @Column({ type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
