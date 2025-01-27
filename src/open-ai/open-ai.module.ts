import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CrawlerModule } from '@/crawler/crawler.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TagModule } from '@/tag/tag.module';

import { OpenAiController } from './open-ai.controller';
import { OpenAiService } from './open-ai.service';

@Module({
  imports: [ConfigModule, CrawlerModule, PrismaModule, TagModule],
  providers: [OpenAiService],
  controllers: [OpenAiController]
})
export class OpenAiModule {}
