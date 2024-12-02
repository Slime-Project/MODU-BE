import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  exports: [CrawlerService],
  imports: [PrismaModule],
  controllers: [CrawlerController],
  providers: [CrawlerService]
})
export class CrawlerModule {}
