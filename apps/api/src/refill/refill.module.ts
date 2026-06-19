import { Module } from '@nestjs/common';
import { RefillService } from './refill.service';
import { RefillController } from './refill.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [RefillController],
  providers: [RefillService],
})
export class RefillModule {}
