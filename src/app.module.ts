import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CollectionModule } from './collection/collection.module';
import { CrawlerModule } from './crawler/crawler.module';
import { KakaoLoginModule } from './kakao/login/kakao-login.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';
import { ReviewImgModule } from './review-img/review-img.module';
import { S3Module } from './s3/s3.module';
import { SearchModule } from './search/search.module';
import { TagModule } from './tag/tag.module';
import { TasksModule } from './tasks/tasks.module';
import { UserModule } from './user/user.module';
import { WishlistCollectionModule } from './wishlist/collection/wishlist-collection.module';
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
    ProductModule,
    SearchModule,
    WishlistProductModule,
    ReviewModule,
    S3Module,
    ReviewImgModule,
    CollectionModule,
    TagModule,
    WishlistCollectionModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
