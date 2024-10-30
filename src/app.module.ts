import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { OpenAiModule } from './open-ai/open-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    UserModule,
    KakaoLoginModule,
    OpenAiModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
