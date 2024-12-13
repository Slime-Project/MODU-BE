import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { ProductService } from '@/product/product.service';
import { SearchDto } from '@/search/dto/search.dto';
import { getMockProduct } from '@/utils/unit-test';

import { SearchService } from './search.service';

import { ProductsData } from '@/types/product.type';

describe('SearchService', () => {
  let searchService: SearchService;
  let productService: DeepMockProxy<ProductService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SearchService, { provide: ProductService, useValue: mockDeep<ProductService>() }]
    }).compile();

    searchService = module.get(SearchService);
    productService = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(searchService).toBeDefined();
  });

  describe('findMany', () => {
    it('should return products data', async () => {
      const product = getMockProduct();
      const searchDto: SearchDto = {
        query: 'query'
      };
      const productsData = {
        products: [product]
      } as ProductsData;
      productService.findMany.mockResolvedValue(productsData);
      const result = await searchService.findMany(searchDto);
      expect(result).toEqual({ products: productsData.products, giftCollections: [] });
    });
  });
});
