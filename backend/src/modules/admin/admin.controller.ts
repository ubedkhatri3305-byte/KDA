import {
  Controller, Get, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('customers')
  @ApiOperation({ summary: 'List all customers with contact info' })
  getCustomers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getAllCustomers(+page, +limit);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  getOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllOrders(+page, +limit, status);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Patch('customers/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle customer active status' })
  toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }
}
