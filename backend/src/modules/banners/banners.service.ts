import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(position?: string) {
    const where = position ? { position } : {};
    return this.prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        position: data.position || 'home',
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async remove(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return this.prisma.banner.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return this.prisma.banner.update({
      where: { id },
      data: { isActive: !banner.isActive },
    });
  }

  async uploadImage(file: Express.Multer.File) {
    const result = await this.cloudinary.uploadFile(file, 'banners');
    return { url: result.secure_url };
  }
}
