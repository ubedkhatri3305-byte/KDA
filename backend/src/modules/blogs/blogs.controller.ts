import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}
}
