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

  async decrementQuantity(
    manager: EntityManager,
    theatreId: string,
    menuItemId: string,
    amount: number,
  ): Promise<Inventory | null> {
    const result = await manager
      .createQueryBuilder()
      .update(Inventory)
      .set({ quantity: () => 'quantity - :amount' })
      .where('theatreId = :theatreId', { theatreId })
      .andWhere('menuItemId = :menuItemId', { menuItemId })
      .andWhere('quantity >= :amount', { amount })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      return null;
    }

    return manager.create(
      Inventory,
      (result.raw as Record<string, unknown>[])[0],
    );
  }

  async findInStockByTheatre(theatreId: string): Promise<Inventory[]> {
    return this.repository
      .createQueryBuilder('inventory')
      .where('inventory.theatreId = :theatreId', { theatreId })
      .andWhere('inventory.quantity > 0')
      .getMany();
  }

  async findAllByTheatre(theatreId: string): Promise<Inventory[]> {
    return this.repository.find({
      where: { theatreId },
      relations: { menuItem: true },
    });
  }

  async save(inventory: Inventory): Promise<Inventory> {
    return this.repository.save(inventory);
  }

  async create(partial: Partial<Inventory>): Promise<Inventory> {
    const inventory = this.repository.create(partial);
    return this.repository.save(inventory);
  }
}
