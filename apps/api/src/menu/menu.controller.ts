import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('theatres/:theatreId/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async getAvailableItems(
    @Param('theatreId', ParseUUIDPipe) theatreId: string,
  ) {
    const items = await this.menuService.getAvailableItems(theatreId);
    return { data: items };
  }
}
