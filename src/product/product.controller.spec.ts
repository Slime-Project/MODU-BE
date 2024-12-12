import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PRODUCTS_PAGE_SIZE } from '@/constants/product';
import { FindProductsDto } from '@/product/dto/find-products.dto';
import { ProductsDto } from '@/product/dto/products.dto';
import { ProductService } from '@/product/product.service';
import { getMockProduct } from '@/utils/unit-test';

import { ProductController } from './product.controller';

import { ProductsData } from '@/types/product.type';

describe('ProductController', () => {
  let controller: ProductController;
  let service: DeepMockProxy<ProductService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockDeep<ProductService>() }]
    }).compile();

    controller = module.get(ProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an instance of ProductsDto', async () => {
      const product = getMockProduct();
      const findProductsDto: FindProductsDto = {
        page: 1,
        query: 'query'
      };
      const totalProducts = 1;
      const productsData: ProductsData = {
        products: [product],
        pageSize: PRODUCTS_PAGE_SIZE,
        totalProducts,
        totalPages: 1
      };
      service.findMany.mockResolvedValue(productsData);
      const result = await controller.findMany(findProductsDto);
      expect(result).toBeInstanceOf(ProductsDto);
    });
  });
});
