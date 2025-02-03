import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

@Module({
  exports: [CrawlerService],
  imports: [PrismaModule],
  controllers: [CrawlerController],
  providers: [CrawlerService]
})
export class CrawlerModule {}
