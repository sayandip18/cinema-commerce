import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { InventoryRepository } from '../inventory/inventory.repository';
import { Inventory } from '../inventory/entities/inventory.entity';
import { RefillInventoryDto } from './dto/refill-inventory.dto';

@Injectable()
export class RefillService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

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
      return await this.inventoryRepository.save(inventory);
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
}
