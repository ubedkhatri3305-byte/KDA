import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PaymentStatus, NotificationType, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.razorpay = new (Razorpay as any)({
      key_id: this.configService.get('razorpay.keyId'),
      key_secret: this.configService.get('razorpay.keySecret'),
    });
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId },
    });

    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
      },
      update: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: this.configService.get('razorpay.keyId'),
      },
    };
  }

  async verifyPayment(
    dto: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderId: string;
    },
    userId: string,
  ) {
    // Verify signature
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('razorpay.keySecret') || '',
      )
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Get payment details from Razorpay
    const rpPayment = await this.razorpay.payments.fetch(dto.razorpayPaymentId);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId: dto.orderId },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: PaymentStatus.PAID,
          method: this.mapPaymentMethod(rpPayment.method),
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: this.mapPaymentMethod(rpPayment.method),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: dto.orderId,
          status: 'CONFIRMED',
          message: 'Payment received. Order confirmed.',
        },
      });
    });

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    await this.notificationsService.send(userId, {
      type: NotificationType.PAYMENT,
      title: 'Payment Successful! 🎉',
      message: `Payment of ₹${order?.total || 0} received for order ${order?.orderNumber || ''}.`,
      data: { orderId: dto.orderId },
    });

    this.logger.log(`Payment verified for order ${dto.orderId}`);
    return { message: 'Payment verified successfully' };
  }

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret =
      this.configService.get<string>('razorpay.webhookSecret') || '';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    this.logger.log(`Razorpay webhook received: ${event}`);

    if (event === 'payment.captured') {
      // Handle captured payment
    } else if (event === 'refund.created') {
      // Handle refund
    }

    return { status: 'ok' };
  }

  async initiateRefund(orderId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });
    if (!payment?.razorpayPaymentId)
      throw new BadRequestException('Payment not found');

    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    const refund = await this.razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: refundAmount,
        notes: { orderId, reason: 'Customer request' },
      },
    );

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        refundId: refund.id,
        refundAmount: refundAmount
          ? refundAmount / 100
          : Number(payment.amount),
        refundedAt: new Date(),
        status: PaymentStatus.REFUNDED,
      },
    });

    return {
      message: 'Refund initiated successfully',
      data: { refundId: refund.id },
    };
  }

  private mapPaymentMethod(method: string): any {
    const map: Record<string, string> = {
      upi: 'UPI',
      card: 'CREDIT_CARD',
      netbanking: 'NET_BANKING',
      wallet: 'WALLET',
    };
    return map[method] || 'UPI';
  }
}
