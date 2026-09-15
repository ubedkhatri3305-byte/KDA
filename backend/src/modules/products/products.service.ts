import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      isFeatured,
      gender,
      tags,
      colors,
      sizes,
      isAdmin,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      // Admins can filter by isActive; customers always see only ACTIVE status products
      ...(isAdmin
        ? isActive !== undefined ? { isActive: String(isActive) === 'true' } : {}
        : { status: 'ACTIVE', isActive: true }),
      ...( (search || categoryId) ? {
        AND: [
          ...(search ? [{
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { tags: { hasSome: [search] } },
            ]
          }] : []),
          ...(categoryId ? [{
            OR: [
              { categoryId: categoryId },
              { category: { slug: categoryId } },
              { category: { parent: { slug: categoryId } } },
              { category: { parent: { id: categoryId } } }
            ]
          }] : [])
        ]
      } : {}),
      ...(brandId && { brandId }),
      ...(gender && { gender: gender }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(colors?.length && {
        variants: { some: { color: { in: colors } } },
      }),
      ...(sizes?.length && {
        variants: { some: { size: { in: sizes } } },
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'price':
        orderBy.basePrice = sortOrder;
        break;
      case 'rating':
        orderBy.ratingAvg = sortOrder;
        break;
      case 'popularity':
        orderBy.soldCount = sortOrder;
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      default:
        orderBy[sortBy] = sortOrder as any;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, logo: true } },
          images: { take: 1, orderBy: { createdAt: 'desc' } },
          variants: { where: { isActive: true }, take: 5 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        videos: true,
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Increment view count
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    // Track recently viewed
    if (userId) {
      await this.prisma.recentlyViewed.upsert({
        where: { userId_productId: { userId, productId: product.id } },
        create: { userId, productId: product.id },
        update: { viewedAt: new Date() },
      });
    }

    return { data: product };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return { data: product };
  }

  async getFeatured() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true, status: 'ACTIVE' },
      take: 12,
      orderBy: { soldCount: 'desc' },
      include: {
        images: { take: 1, orderBy: { createdAt: 'desc' } },
        category: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, take: 3 },
      },
    });
    return { data: products };
  }

  async getTrending() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      take: 10,
      orderBy: [{ soldCount: 'desc' }, { viewCount: 'desc' }],
      include: {
        images: { take: 1, orderBy: { createdAt: 'desc' } },
        category: { select: { name: true, slug: true } },
      },
    });
    return { data: products };
  }

  async getNewArrivals() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1, orderBy: { createdAt: 'desc' } },
        category: { select: { name: true, slug: true } },
      },
    });
    return { data: products };
  }

  async search(query: string, filters: ProductQueryDto) {
    // AI-powered semantic search using embeddings (simplified version)
    const keywords = query
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 2);

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: keywords } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: 50,
      include: {
        images: { take: 1, orderBy: { createdAt: 'desc' } },
        category: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, take: 3 },
      },
    });

    return { data: products, query };
  }

  async getRelated(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const related = await this.prisma.product.findMany({
      where: {
        id: { not: id },
        categoryId: product.categoryId,
        isActive: true,
      },
      take: 8,
      include: { images: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    return { data: related };
  }

  async getReviews(productId: string, page: number) {
    const limit = 10;
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateProductDto, userId: string) {
    const slug = await this.generateSlug(dto.name);
    const sku = await this.generateSku(dto.name);

    // Auto-set isActive to true when status is ACTIVE
    const isActive = dto.status === 'ACTIVE' || (!dto.status ? true : false);

    // Compute totalStock from variants
    const totalStock = dto.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 999;

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        slug,
        sku,
        isActive,
        totalStock,
        variants: dto.variants
          ? {
              create: dto.variants.map((v, i) => ({
                ...v,
                sku: `${sku}-V${i + 1}`,
              })),
            }
          : undefined,
      },
      include: { category: true, variants: true },
    });

    return { data: product, message: 'Product created successfully' };
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!product) throw new NotFoundException('Product not found');

    const { variants, ...updateData } = dto;
    const dataToUpdate: any = { ...updateData };

    if (variants && Array.isArray(variants)) {
      dataToUpdate.totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }

    await this.prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    if (variants && Array.isArray(variants) && product.variants.length > 0 && variants.length > 0) {
      await this.prisma.productVariant.update({
        where: { id: product.variants[0].id },
        data: {
          size: variants[0].size,
          color: variants[0].color,
          colorHex: variants[0].colorHex,
          price: variants[0].price,
          salePrice: variants[0].salePrice,
          stock: variants[0].stock,
        }
      });
    }

    const finalProduct = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true }
    });

    return { data: finalProduct, message: 'Product updated successfully' };
  }

  async remove(id: string) {
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Product deleted successfully' };
  }

  async toggleActive(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const newIsActive = !product.isActive;
    await this.prisma.product.update({
      where: { id },
      data: {
        isActive: newIsActive,
        status: newIsActive ? 'ACTIVE' : 'INACTIVE',
      },
    });
    return {
      message: `Product ${newIsActive ? 'is now visible to customers' : 'is now hidden from customers'}`,
    };
  }


  async uploadImages(productId: string, files: Express.Multer.File[]) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new NotFoundException('No files provided for upload');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const uploadPromises = files.map((file, index) =>
      this.cloudinary.uploadFile(file, `products/${productId}`).then((result) =>
        this.prisma.productImage.create({
          data: {
            productId,
            url: result.secure_url,
            altText: product.name,
            isPrimary: index === 0 && !(product as any)._count?.images,
            sortOrder: index,
          },
        }),
      ),
    );

    const images = await Promise.all(uploadPromises);
    return { data: images, message: 'Images uploaded successfully' };
  }

  private async generateSlug(name: string): Promise<string> {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let count = 0;
    let uniqueSlug = slug;
    while (
      await this.prisma.product.findUnique({ where: { slug: uniqueSlug } })
    ) {
      count++;
      uniqueSlug = `${slug}-${count}`;
    }
    return uniqueSlug;
  }

  private async generateSku(name: string): Promise<string> {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const sku = `${prefix}-${random}`;
    const exists = await this.prisma.product.findUnique({ where: { sku } });
    return exists ? this.generateSku(name) : sku;
  }
}
