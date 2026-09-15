import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { GenerateModelPhotosDto } from './dto/generate-model-photos.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI chatbot - Customer support' })
  chat(
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.aiService.chat(userId, message, sessionId);
  }

  @Public()
  @Post('chat/guest')
  @ApiOperation({ summary: 'AI chatbot - Guest / unauthenticated' })
  chatGuest(
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.aiService.chat('guest', message, sessionId);
  }

  @Post('chat/admin')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI chatbot - Admin assistant with store context' })
  adminChat(
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.aiService.adminChat(userId, message, sessionId);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized AI product recommendations' })
  getRecommendations(
    @CurrentUser('id') userId: string,
    @Query('type') type: 'personal' | 'similar' | 'trending' = 'personal',
  ) {
    return this.aiService.getRecommendations(userId, type);
  }

  @Public()
  @Get('recommendations/trending')
  @ApiOperation({ summary: 'Get trending products (public)' })
  getTrending() {
    return this.aiService.getRecommendations('', 'trending');
  }

  @Public()
  @Post('search/enhance')
  @ApiOperation({ summary: 'Enhance search query with AI' })
  enhanceSearch(@Body('query') query: string) {
    return this.aiService.enhanceSearch(query);
  }

  @Post('generate-description/:productId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI product description (Admin)' })
  generateDescription(
    @Param('productId') productId: string,
    @Body() productData: any,
  ) {
    return this.aiService.generateProductDescription(productId, productData);
  }

  @Post('generate-model-photos/:productId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI model photos for product (Admin)' })
  generateModelPhotos(
    @Param('productId') productId: string,
    @Body() dto: GenerateModelPhotosDto,
  ) {
    return this.aiService.generateModelPhotos(
      productId,
      dto.imageUrl,
      dto.clothingType || '',
      dto.category || '',
    );
  }
}
