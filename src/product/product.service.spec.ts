import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PRODUCTS_PAGE_SIZE } from '@/constants/product';
import { PrismaService } from '@/prisma/prisma.service';
import { FindProductsDto } from '@/product/dto/find-products.dto';
import { NaverProductDto } from '@/product/dto/naver-product.dto';
import { getMockProduct, mockNaverRes } from '@/utils/unit-test';

import { ProductService } from './product.service';

import { ProductsData } from '@/types/product.type';

describe('ProductService', () => {
  let productService: ProductService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    prismaService = module.get(PrismaService);
    productService = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('findMany', () => {
    it('should return products data', async () => {
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
      productService.searchProductsOnNaver = jest
        .fn()
        .mockResolvedValue({ products: [product], totalProducts });
      prismaService.product.upsert.mockResolvedValue(product);
      const result = await productService.findMany(findProductsDto);
      expect(result).toEqual(productsData);
    });
  });

  describe('searchProductsOnNaver', () => {
    it('should return ??', async () => {
      const findProductsDto: FindProductsDto = {
        page: 1,
        query: 'query'
      };
      axios.get = jest.fn().mockResolvedValue({ data: mockNaverRes });
      const result = await productService.searchProductsOnNaver(findProductsDto);
      result.products.forEach(product => {
        expect(product).toBeInstanceOf(NaverProductDto);
      });
      expect(result.totalProducts).toBeGreaterThanOrEqual(0);
    });
  });
});
