import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { CrawlerModule } from './crawler/crawler.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PrismaModule,
    UserModule,
    KakaoLoginModule,
    OpenAiModule,
    CrawlerModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
