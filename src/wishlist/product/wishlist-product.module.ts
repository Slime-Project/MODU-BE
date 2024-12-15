import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';
import { WishlistProductController } from '@/wishlist/product/wishlist-product.controller';

import { WishlistProductService } from './wishlist-product.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [WishlistProductController],
  providers: [WishlistProductService],
  exports: [WishlistProductService]
})
export class WishlistProductModule {}
