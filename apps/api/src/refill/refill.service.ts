import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { InventoryRepository } from '../inventory/inventory.repository';
import { Inventory } from '../inventory/entities/inventory.entity';
import { MenuCacheService } from '../menu/menu-cache.service';
import { MenuRepository } from '../menu/menu.repository';
import { RefillInventoryDto } from './dto/refill-inventory.dto';
import { BulkRefillInventoryDto } from './dto/bulk-refill-inventory.dto';

export interface InventoryOverviewItem {
  menuItemId: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  quantity: number;
}

@Injectable()
export class RefillService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly menuCacheService: MenuCacheService,
    private readonly menuRepository: MenuRepository,
    private readonly dataSource: DataSource,
  ) {}

  async refillInventory(dto: RefillInventoryDto): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findByTheatreAndMenuItem(
      dto.theatreId,
      dto.menuItemId,
    );

    if (!inventory) {
      throw new NotFoundException(
        `Inventory record not found for theatre ${dto.theatreId} and menu item ${dto.menuItemId}`,
      );
    }

    if (inventory.version !== dto.expectedVersion) {
      throw new ConflictException(
        `Inventory was modified by another user. Current version: ${inventory.version}, your version: ${dto.expectedVersion}`,
      );
    }

    inventory.quantity = dto.quantity;

    try {
      const saved = await this.inventoryRepository.save(inventory);
      await this.menuCacheService.invalidate(dto.theatreId);
      return saved;
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'Inventory was modified by another user. Please refresh and try again.',
        );
      }
      throw error;
    }
  }

  async getInventory(theatreId: string): Promise<Inventory[]> {
    return this.inventoryRepository.findInStockByTheatre(theatreId);
  }

  async getInventoryItem(
    theatreId: string,
    menuItemId: string,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findByTheatreAndMenuItem(
      theatreId,
      menuItemId,
    );

    if (!inventory) {
      throw new NotFoundException(
        `Inventory record not found for theatre ${theatreId} and menu item ${menuItemId}`,
      );
    }

    return inventory;
  }

  async getInventoryOverview(
    theatreId: string,
  ): Promise<InventoryOverviewItem[]> {
    const [allMenuItems, inventoryRecords] = await Promise.all([
      this.menuRepository.findAll(),
      this.inventoryRepository.findAllByTheatre(theatreId),
    ]);

    const inventoryMap = new Map(
      inventoryRecords.map((inv) => [inv.menuItemId, inv.quantity]),
    );

    return allMenuItems.map((item) => ({
      menuItemId: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      basePrice: Number(item.basePrice),
      quantity: inventoryMap.get(item.id) ?? 0,
    }));
  }

  async bulkRefillInventory(
    dto: BulkRefillInventoryDto,
  ): Promise<InventoryOverviewItem[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingInventory = await queryRunner.manager.find(Inventory, {
        where: { theatreId: dto.theatreId },
      });

      const inventoryMap = new Map(
        existingInventory.map((inv) => [inv.menuItemId, inv]),
      );

      const toUpdate: Inventory[] = [];
      const toInsert: Partial<Inventory>[] = [];

      for (const item of dto.items) {
        const existing = inventoryMap.get(item.menuItemId);

        if (existing) {
          existing.quantity = item.quantity;
          toUpdate.push(existing);
        } else {
          toInsert.push({
            theatreId: dto.theatreId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          });
        }
      }

      if (toInsert.length > 0) {
        await queryRunner.manager.insert(Inventory, toInsert);
      }

      if (toUpdate.length > 0) {
        await queryRunner.manager.save(Inventory, toUpdate);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await this.menuCacheService.invalidate(dto.theatreId);
    return this.getInventoryOverview(dto.theatreId);
  }
}
