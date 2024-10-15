import { Module } from '@nestjs/common';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule, KakaoLoginModule],
  controllers: [],
  providers: []
})
export class AppModule {}
