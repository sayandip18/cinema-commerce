import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { RefillService } from './refill.service';
import { RefillInventoryDto } from './dto/refill-inventory.dto';
import { BulkRefillInventoryDto } from './dto/bulk-refill-inventory.dto';

@Controller('admin/inventory')
export class RefillController {
  constructor(private readonly refillService: RefillService) {}

  @Put()
  async refillInventory(@Body() dto: RefillInventoryDto) {
    const inventory = await this.refillService.refillInventory(dto);
    return { data: inventory };
  }

  @Put('bulk')
  async bulkRefillInventory(@Body() dto: BulkRefillInventoryDto) {
    const overview = await this.refillService.bulkRefillInventory(dto);
    return { data: overview };
  }

  @Get('overview/:theatreId')
  async getInventoryOverview(
    @Param('theatreId', ParseUUIDPipe) theatreId: string,
  ) {
    const overview = await this.refillService.getInventoryOverview(theatreId);
    return { data: overview };
  }

  @Get(':theatreId')
  async getTheatreInventory(
    @Param('theatreId', ParseUUIDPipe) theatreId: string,
  ) {
    const inventory = await this.refillService.getInventory(theatreId);
    return { data: inventory };
  }

  @Get(':theatreId/:menuItemId')
  async getInventoryItem(
    @Param('theatreId', ParseUUIDPipe) theatreId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
  ) {
    const inventory = await this.refillService.getInventoryItem(
      theatreId,
      menuItemId,
    );
    return { data: inventory };
  }
}
