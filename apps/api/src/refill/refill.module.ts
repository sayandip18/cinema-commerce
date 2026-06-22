import { Module } from '@nestjs/common';
import { RefillService } from './refill.service';
import { RefillController } from './refill.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [InventoryModule, MenuModule],
  controllers: [RefillController],
  providers: [RefillService],
})
export class RefillModule {}
