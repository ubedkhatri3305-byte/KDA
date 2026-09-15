import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all banners' })
  findAll(@Query('position') position?: string) {
    return this.bannersService.findAll(position);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new banner (Admin)' })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload banner image (Admin)' })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.bannersService.uploadImage(file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete banner (Admin)' })
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle banner active status (Admin)' })
  toggleActive(@Param('id') id: string) {
    return this.bannersService.toggleActive(id);
  }
}
