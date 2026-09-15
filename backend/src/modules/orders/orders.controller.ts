import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place order from cart' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my orders' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page: any = 1,
    @Query('limit') limit: any = 10,
  ) {
    return this.ordersService.findAll(userId, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.findOne(id, userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancel(id, userId, reason);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Request return for delivered order' })
  requestReturn(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
    @Body('description') description?: string,
  ) {
    return this.ordersService.requestReturn(id, userId, reason, description);
  }

  // Admin routes
  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  getAdminOrders(
    @Query('page') page: any = 1,
    @Query('limit') limit: any = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.getAdminOrders(Number(page), Number(limit), status, search);
  }

  @Patch('admin/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('message') message?: string,
    @Body('trackingNumber') trackingNumber?: string,
  ) {
    return this.ordersService.updateStatus(id, status, message, trackingNumber);
  }

  @Patch('admin/:id/toggle-reviewed')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Toggle order reviewed status (Admin)' })
  toggleReviewed(@Param('id') id: string) {
    return this.ordersService.toggleReviewed(id);
  }
}
