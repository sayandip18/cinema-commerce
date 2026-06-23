import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuRepository } from './menu.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { MenuCacheService } from './menu-cache.service';

const LOW_STOCK_THRESHOLD = 5;

export interface AvailableMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  lowStock: boolean;
}

@Injectable()
export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly menuCacheService: MenuCacheService,
  ) {}

  async getAvailableItems(theatreId: string): Promise<AvailableMenuItem[]> {
    return this.menuCacheService.getOrLoad(theatreId, () =>
      this.loadAvailableItems(theatreId),
    );
  }

  private async loadAvailableItems(
    theatreId: string,
  ): Promise<AvailableMenuItem[]> {
    const inventoryItems =
      await this.inventoryRepository.findInStockByTheatre(theatreId);

    if (inventoryItems.length === 0) {
      return [];
    }

    const menuItemIds = inventoryItems.map((inv) => inv.menuItemId);
    const menuItems = await this.menuRepository.findByIds(menuItemIds);

    const quantityByMenuItemId = new Map(
      inventoryItems.map((inv) => [inv.menuItemId, inv.quantity]),
    );

    return menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      basePrice: item.basePrice,
      lowStock: (quantityByMenuItemId.get(item.id) ?? 0) <= LOW_STOCK_THRESHOLD,
    }));
  }

  async findById(id: string) {
    const item = await this.menuRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    return item;
  }
}
