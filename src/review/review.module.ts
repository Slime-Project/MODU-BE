import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';

import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [JwtModule, ConfigModule, PrismaModule],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService]
})
export class ReviewModule {}
