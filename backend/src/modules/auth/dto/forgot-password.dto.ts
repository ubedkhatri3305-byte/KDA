import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com or 9876543210' })
  @IsString()
  @MinLength(3)
  email: string;
}
