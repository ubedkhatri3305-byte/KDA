import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Header,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Public Routes ─────────────────────────────────────────
  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  @ApiOperation({
    summary: 'Get all products with filtering, sorting, pagination',
  })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get featured products' })
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @Public()
  @Get('trending')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get trending products' })
  getTrending() {
    return this.productsService.getTrending();
  }

  @Public()
  @Get('new-arrivals')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get new arrival products' })
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'AI-powered natural language product search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  search(@Query('q') query: string, @Query() filters: ProductQueryDto) {
    return this.productsService.search(query, filters);
  }

  @Public()
  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  @ApiOperation({ summary: 'Get product by slug' })
  findOne(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.productsService.findBySlug(slug, user?.id);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  getRelated(@Param('id') id: string) {
    return this.productsService.getRelated(id);
  }

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  getReviews(
    @Param('id') id: string,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    return this.productsService.getReviews(id, page);
  }

  // ─── Admin Routes ───────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new product (Admin)' })
  create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (Admin)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product images (Admin)' })
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.uploadImages(id, files);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product by ID (Admin)' })
  getAdminProduct(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  toggleActive(@Param('id') id: string) {
    return this.productsService.toggleActive(id);
  }
}
