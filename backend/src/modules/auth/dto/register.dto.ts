import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Required Indian mobile number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit Indian mobile number' })
  phone: string;

  @ApiProperty({ example: '9876543210', description: 'WhatsApp number for contact (optional, defaults to phone)' })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit WhatsApp number' })
  whatsappNumber?: string;

  @ApiProperty({ example: true, description: 'Consent to be contacted via WhatsApp' })
  @IsBoolean()
  whatsappConsent: boolean;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;
}
