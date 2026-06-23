import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('demographics')
  async getDemographics() {
    const data = await this.analyticsService.getDemographics();
    return { data };
  }
}
