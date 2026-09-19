import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  async findAll() {
    return this.categoriesService.findAll();
  }
}
