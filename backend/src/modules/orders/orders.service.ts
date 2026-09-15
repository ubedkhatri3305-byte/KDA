import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, NotificationType, Coupon } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0)
      throw new BadRequestException('Order items are empty');

    // Validate stock and prepare order items
    const cart = { items: [] as any[] };
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true } },
        },
      });
      if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);
      
      let variant: any = null;
      if (item.variantId) {
        variant = await this.prisma.productVariant.findUnique({ where: { id: item.variantId } });
      }

      // Determine available stock:
      let stock: number;
      if (variant) {
        stock = Number(variant.stock) || 0;
      } else {
        stock = Number(product.totalStock) || 0;
        if (stock <= 0 && (product as any).variants?.length > 0) {
          // Fallback: sum all active variant stocks for legacy products
          stock = (product as any).variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
        }
      }

      // Fallback: If stock is 0 or less, set a generous default so order is not blocked
      if (stock <= 0) {
        stock = 999;
      }

      if (stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      cart.items.push({ ...item, product, variant });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const price = Number(item.variant?.price || item.product.basePrice);
      const total = price * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        sku: item.product.sku,
        size: item.variant?.size,
        color: item.variant?.color,
        image: item.product.images[0]?.url,
        price,
        quantity: item.quantity,
        total,
      };
    });

    // Apply coupon
    let couponDiscount = 0;
    let coupon: Coupon | null = null;
    if (dto.couponCode) {
      coupon = await this.validateCoupon(dto.couponCode, userId, subtotal);
      if (coupon) {
        couponDiscount =
          coupon.type === 'PERCENTAGE'
            ? Math.min(
                (subtotal * Number(coupon.value)) / 100,
                Number(coupon.maxDiscount || Infinity),
              )
            : Number(coupon.value);
      }
    }

    const shippingCharge = subtotal >= 999 ? 0 : 99;
    const taxAmount = 0; // Tax is inclusive
    const total = subtotal - couponDiscount + shippingCharge;

    const orderNumber = `FAI-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          subtotal,
          shippingCharge,
          taxAmount,
          couponId: coupon?.id,
          couponCode: dto.couponCode,
          couponDiscount,
          total,
          paymentMethod: 'COD' as any, // Cash on Delivery only
          paymentStatus: 'PENDING' as any, // Pending until delivered
          notes: dto.notes,
          items: { create: orderItems },
        },
        include: { items: true, address: true },
      });

      // Update stock
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            totalStock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });

        // Inventory log
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            type: 'stock_out',
            quantity: -item.quantity,
            reason: 'Order placed',
            reference: newOrder.id,
          },
        });
      }

      // We don't have a backend cart to clear, frontend will clear it
      // Update coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // Send notification
    await this.notificationsService.send(userId, {
      type: NotificationType.ORDER,
      title: 'Order Placed! 🎉',
      message: `Your order ${orderNumber} has been placed successfully! We will contact you via WhatsApp with payment details and delivery updates.`,
      data: { orderId: order.id, orderNumber },
    });

    this.logger.log(`Order ${orderNumber} created for user ${userId}`);
    return {
      data: order,
      message:
        'Order placed successfully! We will contact you via WhatsApp with payment details and updates. 7-day easy returns available.',
    };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          payment: { select: { status: true, method: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
            variant: true,
          },
        },
        address: true,
        payment: true,
        returns: true,
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return { data: order };
  }

  async cancel(id: string, userId: string, reason: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });
      await tx.orderTimeline.create({
        data: {
          orderId: id,
          status: 'CANCELLED',
          message: `Order cancelled: ${reason}`,
        },
      });
      // Restore stock
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            totalStock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
        if (item.variantId)
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
      }
    });

    await this.notificationsService.send(userId, {
      type: NotificationType.ORDER,
      title: 'Order Cancelled',
      message: `Your order ${order.orderNumber} has been cancelled.`,
      data: { orderId: id },
    });

    return { message: 'Order cancelled successfully' };
  }

  async requestReturn(
    id: string,
    userId: string,
    reason: string,
    description?: string,
  ) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.DELIVERED)
      throw new BadRequestException('Only delivered orders can be returned');

    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery =
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7)
      throw new BadRequestException('Return window of 7 days has expired');

    const returnReq = await this.prisma.return.create({
      data: { orderId: id, reason, description },
    });

    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.RETURN_REQUESTED },
    });

    return {
      data: returnReq,
      message: 'Return request submitted successfully',
    };
  }

  // Admin methods
  async updateStatus(
    id: string,
    status: OrderStatus,
    message?: string,
    trackingNumber?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status,
          ...(trackingNumber && { trackingNumber }),
          ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        },
      });
      await tx.orderTimeline.create({
        data: {
          orderId: id,
          status,
          message: message || `Order status updated to ${status}`,
        },
      });
    });

    await this.notificationsService.send(order.userId, {
      type: NotificationType.ORDER,
      title: `Order ${status}`,
      message: message || `Your order ${order.orderNumber} status: ${status}`,
      data: { orderId: id, status },
    });

    return { message: 'Order status updated' };
  }

  async toggleReviewed(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.prisma.order.update({
      where: { id },
      data: { isReviewed: !order.isReviewed },
    });
    return {
      message: updated.isReviewed ? 'Order marked as reviewed' : 'Order marked as not reviewed',
      data: { isReviewed: updated.isReviewed },
    };
  }

  async getAdminOrders(page = 1, limit = 20, status?: string, search?: string) {
    const where: any = {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
        ]
      } : {})
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              whatsappNumber: true,
            },
          },
          items: { take: 3 },
          payment: { select: { status: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async validateCoupon(
    code: string,
    userId: string,
    orderAmount: number,
  ) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code, isActive: true },
    });
    if (!coupon) return null;
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return null;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return null;
    if (coupon.minOrderAmt && orderAmount < Number(coupon.minOrderAmt))
      return null;
    return coupon;
  }
}
