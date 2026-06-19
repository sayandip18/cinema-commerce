import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

interface AuthenticatedRequest {
  user: { id: string; phone: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async placeOrder(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.orderService.placeOrder(req.user.id, dto);
    return { data: order };
  }

  @Get()
  async getMyOrders(@Request() req: AuthenticatedRequest) {
    const orders = await this.orderService.getOrdersByUser(req.user.id);
    return { data: orders };
  }

  @Get(':id')
  async getOrder(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.orderService.getOrderById(req.user.id, id);
    return { data: order };
  }
}
