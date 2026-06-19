import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryRepository } from './inventory.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],
  providers: [InventoryRepository],
  exports: [InventoryRepository],
})
export class InventoryModule {}
