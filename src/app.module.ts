import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';

import { AuthModule } from './auth/auth.module';
import { CrawlerModule } from './crawler/crawler.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // 필요한지?
    ScheduleModule.forRoot(), // forRoot 필요한지?
    AuthModule,
    PrismaModule,
    UserModule,
    KakaoLoginModule,
    OpenAiModule,
    CrawlerModule,
    TasksModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
