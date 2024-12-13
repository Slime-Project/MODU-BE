import { Injectable } from '@nestjs/common';

import { FindProductsDto } from '@/product/dto/find-products.dto';
import { ProductService } from '@/product/product.service';
import { SearchDto } from '@/search/dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly productService: ProductService) {}

  async findMany(searchDto: SearchDto) {
    const findProductsDto: FindProductsDto = {
      page: 1,
      query: searchDto.query
    };
    const { products } = await this.productService.findMany(findProductsDto);

    const giftCollections = [];

    return { products, giftCollections };
  }
}
