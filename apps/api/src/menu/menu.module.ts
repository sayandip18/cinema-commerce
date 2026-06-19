import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem]), InventoryModule],
  controllers: [MenuController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService, MenuRepository],
})
export class MenuModule {}
