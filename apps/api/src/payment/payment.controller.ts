import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';

interface AuthenticatedRequest {
  user: { id: string; phone: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':id/pay')
  async pay(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('simulateDelay') simulateDelay?: string,
  ) {
    const delay = simulateDelay ? parseInt(simulateDelay, 10) : undefined;
    const payment = await this.paymentService.initiatePayment(
      req.user.id,
      id,
      delay,
    );
    return { data: payment };
  }
}
