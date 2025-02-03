import { Module } from '@nestjs/common';

import { ProductModule } from '@/product/product.module';
import { SearchController } from '@/search/search.controller';
import { SearchService } from '@/search/search.service';

@Module({
  imports: [ProductModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService]
})
export class SearchModule {}
