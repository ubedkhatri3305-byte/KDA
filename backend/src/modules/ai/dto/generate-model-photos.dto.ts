import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateModelPhotosDto {
  @ApiProperty({
    description: 'URL of the clothing product image',
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Clothing type (e.g. dress, shirt, saree, kurta)',
    example: 'shirt',
  })
  @IsOptional()
  @IsString()
  clothingType?: string;

  @ApiPropertyOptional({
    description: 'Category (e.g. men, women, ethnic, formal)',
    example: 'men',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
