import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';

import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';

@Module({
  imports: [JwtModule, ConfigModule, PrismaModule],
  providers: [ProductReviewService],
  controllers: [ProductReviewController],
  exports: [ProductReviewService]
})
export class ProductReviewModule {}
