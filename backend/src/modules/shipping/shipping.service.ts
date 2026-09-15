import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}
}
