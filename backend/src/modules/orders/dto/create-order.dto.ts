import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() addressId?: string;
  @ApiProperty() @IsOptional() @IsString() couponCode?: string;
  @ApiProperty() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() items?: any[];
  @ApiPropertyOptional() @IsOptional() customerPhone?: string;
  @ApiPropertyOptional() @IsOptional() customerAddress?: string;
}
