import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';
import { ProductWishlistController } from '@/wishlist/product/product-wishlist.controller';

import { ProductWishlistService } from './product-wishlist.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [ProductWishlistController],
  providers: [ProductWishlistService],
  exports: [ProductWishlistService]
})
export class ProductWishlistModule {}
