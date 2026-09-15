import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('mail.host'),
      port: this.configService.get('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.pass'),
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"${this.configService.get('mail.fromName')}" <${this.configService.get('mail.from')}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendEmailVerification(email: string, firstName: string, otp: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">K D A 👗</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p style="color: #666;">Hi ${firstName},</p>
          <p style="color: #666;">Your email verification OTP is:</p>
          <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>`;
    await this.sendMail(email, 'Verify Your K D A Account', html);
  }

  async sendPasswordReset(email: string, firstName: string, otp: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">K D A 🔐</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666;">Hi ${firstName},</p>
          <p style="color: #666;">Your password reset OTP is:</p>
          <div style="background: white; border: 2px solid #f5576c; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #f5576c; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">This OTP is valid for 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>`;
    await this.sendMail(email, 'Reset Your K D A Password', html);
  }

  async sendOrderConfirmation(
    email: string,
    firstName: string,
    orderNumber: string,
    total: number,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="color: #666;">Hi ${firstName}, your order has been confirmed!</p>
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total Amount:</strong> ₹${total}</p>
          </div>
          <p style="color: #666;">Track your order in the K D A app.</p>
        </div>
      </div>`;
    await this.sendMail(email, `Order Confirmed - ${orderNumber}`, html);
  }
}
