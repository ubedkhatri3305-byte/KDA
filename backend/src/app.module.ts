import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { OrdersModule } from './modules/orders/orders.module';
// PaymentsModule removed — COD only
import { CouponsModule } from './modules/coupons/coupons.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { BannersModule } from './modules/banners/banners.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { MailModule } from './mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import cloudinaryConfig from './config/cloudinary.config';
// razorpayConfig removed — COD only
import aiConfig from './config/ai.config';
import mailConfig from './config/mail.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        cloudinaryConfig,
        // razorpayConfig removed
        aiConfig,
        mailConfig,
      ],
      envFilePath: ['.env', '.env.local'],
    }),

    // In-memory Cache for fast data responses
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // 60 seconds default TTL
      max: 500, // Max 500 items in cache
    }),

    // Rate Limiting (Short limit increased to 20 to accommodate parallel product queries on first load)
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Core
    PrismaModule,
    MailModule,
    CloudinaryModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    // PaymentsModule removed — COD only
    CouponsModule,
    ReviewsModule,
    InventoryModule,
    NotificationsModule,
    AiModule,
    AdminModule,
    BannersModule,
    BlogsModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
