import { Controller, Get, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('products')
  public getProducts(
    @Query('product') product: string,
    @Query('min') minPrice: string,
    @Query('max') maxPrice: string
  ) {
    return this.crawlerService.getProducts(product, minPrice, maxPrice);
  }
}
