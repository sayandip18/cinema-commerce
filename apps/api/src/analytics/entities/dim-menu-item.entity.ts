import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('dim_menu_items')
export class DimMenuItem {
  @PrimaryColumn('uuid')
  itemId: string;

  @Column({ length: 255 })
  itemName: string;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;
}
