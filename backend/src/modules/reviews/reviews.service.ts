import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { productId: string; rating: number; comment?: string }) {
    // Check if user has purchased the product and it is delivered
    const hasDeliveredOrder = await this.prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!hasDeliveredOrder) {
      throw new BadRequestException('You can only review products after they have been delivered to you.');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        isApproved: true,
      }
    });

    // Update product rating
    const aggregates = await this.prisma.review.aggregate({
      where: { productId: data.productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await this.prisma.product.update({
      where: { id: data.productId },
      data: {
        ratingAvg: aggregates._avg.rating || 0,
        ratingCount: aggregates._count.rating || 0
      }
    });

    return { data: review, message: 'Review submitted successfully' };
  }

  async findAll() {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { name: true, images: { take: 1 } } }
      }
    });
    return { data: reviews };
  }
}
