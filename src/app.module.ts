import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { KakaoLoginModule } from '@/kakao/login/kakao-login.module';

import { AuthModule } from './auth/auth.module';
import { CrawlerModule } from './crawler/crawler.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';
import { SearchModule } from './search/search.module';
import { TasksModule } from './tasks/tasks.module';
import { UserModule } from './user/user.module';
import { WishlistProductModule } from './wishlist/product/wishlist-product.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    UserModule,
    KakaoLoginModule,
    OpenAiModule,
    CrawlerModule,
    TasksModule,
    ReviewModule,
    ProductModule,
    SearchModule,
    WishlistProductModule
  ]
})
export class AppModule {}
