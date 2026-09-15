import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDecimal,
  MinLength,
  MaxLength,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, ProductStatus } from '@prisma/client';

export class CreateVariantDto {
  @ApiProperty() @IsString() @IsOptional() size?: string;
  @ApiProperty() @IsString() @IsOptional() color?: string;
  @ApiProperty() @IsString() @IsOptional() colorHex?: string;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiProperty() @IsNumber() @IsOptional() @Min(0) salePrice?: number;
  @ApiProperty() @IsNumber() @Min(0) stock: number;
}

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(255) name: string;
  @ApiProperty() @IsString() @IsOptional() description?: string;
  @ApiProperty() @IsArray() @IsOptional() highlights?: string[];
  @ApiProperty() @IsOptional() features?: any;
  @ApiProperty() @IsOptional() specifications?: any;
  @ApiProperty() @IsString() categoryId: string;
  @ApiProperty() @IsString() @IsOptional() brandId?: string;
  @ApiProperty({ enum: Gender }) @IsEnum(Gender) @IsOptional() gender?: Gender;
  @ApiProperty() @IsNumber() @Min(0) basePrice: number;
  @ApiProperty() @IsNumber() @IsOptional() @Min(0) salePrice?: number;
  @ApiProperty() @IsNumber() @IsOptional() @Min(0) taxRate?: number;
  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
  @ApiProperty() @IsBoolean() @IsOptional() isFeatured?: boolean;
  @ApiProperty() @IsArray() @IsOptional() tags?: string[];
  @ApiProperty() @IsString() @IsOptional() metaTitle?: string;
  @ApiProperty() @IsString() @IsOptional() metaDesc?: string;
  @ApiProperty() @IsArray() @IsOptional() metaKeywords?: string[];

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
