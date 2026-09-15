import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      recentOrders,
      topProducts,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
      this.prisma.order.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, whatsappNumber: true } },
          items: { take: 1, include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { soldCount: 'desc' },
        take: 5,
        select: { id: true, name: true, soldCount: true, basePrice: true, totalStock: true },
      }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    // Revenue from all orders
    const revenueResult = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ['CANCELLED'] } },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await this.prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    });

    return {
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalProducts,
          pendingOrders,
          todayOrders,
          totalRevenue: Number(revenueResult._sum.total || 0),
        },
        recentOrders,
        topProducts,
      },
    };
  }

  async getAllCustomers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          whatsappConsent: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    return {
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as any } : {};
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, whatsappNumber: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });
    await this.prisma.orderTimeline.create({
      data: { orderId, status, message: `Order status updated to ${status} by admin` },
    });
    return { data: order, message: 'Order status updated' };
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, email: true },
    });
    return { data: updated, message: `User ${updated.isActive ? 'activated' : 'deactivated'}` };
  }
}
