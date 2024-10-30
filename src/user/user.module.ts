import { Module } from '@nestjs/common';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, KakaoLoginModule],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
