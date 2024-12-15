import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { WISHLIST_PRODUCTS_PAGE_SIZE } from '@/constants/page';
import { getMockProduct } from '@/utils/unit-test';
import { FindWishlistProductsDto } from '@/wishlist/product/dto/find-wishlist-products.dto';
import { WishlistProductDto } from '@/wishlist/product/dto/wishlist-product.dto';
import { WishlistProductsDto } from '@/wishlist/product/dto/wishlist-products.dto';
import { WishlistProductService } from '@/wishlist/product/wishlist-product.service';

import { WishlistProductController } from './wishlist-product.controller';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { WishlistProductsData } from '@/types/wishlist.type';

describe('WishlistProductController', () => {
  let controller: WishlistProductController;
  let service: DeepMockProxy<WishlistProductService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WishlistProductController],
      providers: [
        { provide: WishlistProductService, useValue: mockDeep<WishlistProductService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() }
      ]
    }).compile();

    controller = module.get(WishlistProductController);
    service = module.get(WishlistProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return an instance of WishlistProductDto', async () => {
      const product = getMockProduct();
      const req = {
        id: '1'
      } as TokenGuardReq;
      service.create.mockResolvedValue({ product });
      const result = await controller.create(req, product.id);
      expect(result).toBeInstanceOf(WishlistProductDto);
    });
  });

  describe('remove', () => {
    it('should call remove method of WishlistProductService', async () => {
      const req = {
        id: '1'
      } as TokenGuardReq;
      await controller.remove(req, 1);
      expect(service.remove).toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('should return an instance of WishlistProductsDto', async () => {
      const req = {
        id: '1'
      } as TokenGuardReq;
      const findWishlistProductsDto: FindWishlistProductsDto = {
        page: 1
      };
      const product = getMockProduct();
      const wishlistProductsData: WishlistProductsData = {
        products: [product],
        pageSize: WISHLIST_PRODUCTS_PAGE_SIZE,
        total: 1,
        totalPages: 1
      };
      service.findMany.mockResolvedValue(wishlistProductsData);
      const result = await controller.findMany(req, findWishlistProductsDto);
      expect(result).toBeInstanceOf(WishlistProductsDto);
    });
  });
});
