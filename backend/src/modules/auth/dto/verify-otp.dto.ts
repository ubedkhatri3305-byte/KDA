import { IsEmail, IsString, Length, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ enum: ['email_verify', 'phone_verify', 'password_reset'] })
  @IsIn(['email_verify', 'phone_verify', 'password_reset'])
  type: string;
}
