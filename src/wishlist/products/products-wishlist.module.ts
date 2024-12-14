import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';
import { ProductsWishlistController } from '@/wishlist/products/products-wishlist.controller';

import { ProductsWishlistService } from './products-wishlist.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [ProductsWishlistController],
  providers: [ProductsWishlistService],
  exports: [ProductsWishlistService]
})
export class ProductsWishlistModule {}
