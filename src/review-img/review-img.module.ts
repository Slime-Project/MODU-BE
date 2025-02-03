import { Module } from '@nestjs/common';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { ReviewImgController } from './review-img.controller';
import { ReviewImgService } from './review-img.service';

@Module({
  imports: [PrismaModule, KakaoLoginModule],
  providers: [ReviewImgService],
  controllers: [ReviewImgController],
  exports: [ReviewImgService]
})
export class ReviewImgModule {}
