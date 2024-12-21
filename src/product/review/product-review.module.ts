import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { S3Module } from '@/s3/s3.module';

import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';

@Module({
  imports: [JwtModule, ConfigModule, PrismaModule, KakaoLoginModule, S3Module],
  providers: [ProductReviewService],
  controllers: [ProductReviewController],
  exports: [ProductReviewService]
})
export class ProductReviewModule {}
