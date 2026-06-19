import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repository: Repository<Inventory>,
  ) {}

  async findById(id: string): Promise<Inventory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTheatreAndMenuItem(
    theatreId: string,
    menuItemId: string,
  ): Promise<Inventory | null> {
    return this.repository.findOne({ where: { theatreId, menuItemId } });
  }

  async findByTheatreAndMenuItemForUpdate(
    manager: EntityManager,
    theatreId: string,
    menuItemId: string,
  ): Promise<Inventory | null> {
    return manager
      .createQueryBuilder(Inventory, 'inventory')
      .setLock('pessimistic_write')
      .where('inventory.theatreId = :theatreId', { theatreId })
      .andWhere('inventory.menuItemId = :menuItemId', { menuItemId })
      .getOne();
  }

  async findInStockByTheatre(theatreId: string): Promise<Inventory[]> {
    return this.repository
      .createQueryBuilder('inventory')
      .where('inventory.theatreId = :theatreId', { theatreId })
      .andWhere('inventory.quantity > 0')
      .getMany();
  }

  async save(inventory: Inventory): Promise<Inventory> {
    return this.repository.save(inventory);
  }

  async saveWithManager(
    manager: EntityManager,
    inventory: Inventory,
  ): Promise<Inventory> {
    return manager.save(Inventory, inventory);
  }
}
