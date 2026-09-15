import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─── Register ────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('Email already registered');

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) throw new ConflictException('Phone number already registered');

    // Validate WhatsApp consent
    if (!dto.whatsappConsent) {
      throw new BadRequestException(
        'WhatsApp contact consent is required to complete registration',
      );
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        whatsappNumber: dto.whatsappNumber || dto.phone,
        whatsappConsent: dto.whatsappConsent,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNumber: true,
        role: true,
      },
    });

    // Create cart and wishlist
    await Promise.all([
      this.prisma.cart.create({ data: { userId: user.id } }),
      this.prisma.wishlist.create({ data: { userId: user.id } }),
    ]);

    // Send OTP
    await this.sendOtp(user.id, 'email_verify');

    this.logger.log(`New user registered: ${user.email}`);
    return {
      message: 'Registration successful. Please verify your email.',
      data: user,
    };
  }

  // ─── Login ───────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('User not found. Please register first.');
    if (!user.isActive)
      throw new UnauthorizedException('Account is deactivated');

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Incorrect password');

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user.id, user.email, user.role),
      this.generateRefreshToken(user.id),
    ]);

    // Save refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }

  // ─── Refresh Tokens ──────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role,
      ),
      this.generateRefreshToken(tokenRecord.user.id),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ──────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  // ─── Verify OTP ──────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: dto.otp,
        type: dto.type,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otpToken.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    if (dto.type === 'email_verify') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    return { message: 'OTP verified successfully' };
  }

  // ─── Forgot Password ─────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, you will receive a reset OTP' };
    }
    await this.sendOtp(user.id, 'password_reset');
    return { message: 'If the email exists, you will receive a reset OTP' };
  }

  // ─── Reset Password ──────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: dto.otp,
        type: 'password_reset',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await Promise.all([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.otpToken.update({
        where: { id: otp.id },
        data: { isUsed: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      }),
    ]);

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  // ─── Change Password ─────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const passwordValid = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!passwordValid)
      throw new BadRequestException('Current password is incorrect');

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: 'Password changed successfully' };
  }

  // ─── Validate User (for Passport) ────────────────────────────
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        phone: true,
        whatsappNumber: true,
        whatsappConsent: true,
      },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────
  private async generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpires'),
      },
    );
  }

  private async generateRefreshToken(userId: string) {
    return this.jwtService.signAsync(
      { sub: userId, tokenId: uuidv4() },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpires'),
      },
    );
  }

  private async sendOtp(userId: string, type: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpToken.create({
      data: { userId, token: otp, type, expiresAt },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (type === 'email_verify') {
      await this.mailService.sendEmailVerification(
        user.email,
        user.firstName,
        otp,
      );
    } else if (type === 'password_reset') {
      await this.mailService.sendPasswordReset(user.email, user.firstName, otp);
    }
  }
}
