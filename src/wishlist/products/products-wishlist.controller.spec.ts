import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { getMockProduct } from '@/utils/unit-test';
import { ProductsWishlistDto } from '@/wishlist/products/dto/products-wishlist.dto';
import { ProductsWishlistService } from '@/wishlist/products/products-wishlist.service';

import { ProductsWishlistController } from './products-wishlist.controller';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

describe('ProductsWishlistController', () => {
  let controller: ProductsWishlistController;
  let service: DeepMockProxy<ProductsWishlistService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsWishlistController],
      providers: [
        { provide: ProductsWishlistService, useValue: mockDeep<ProductsWishlistService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() }
      ]
    }).compile();

    controller = module.get(ProductsWishlistController);
    service = module.get(ProductsWishlistService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return an instance of ProductsWishlistDto', async () => {
      const product = getMockProduct();
      const req = {
        id: '1'
      } as TokenGuardReq;
      service.create.mockResolvedValue({ product });
      const result = await controller.create(req, product.id);
      expect(result).toBeInstanceOf(ProductsWishlistDto);
    });
  });
});
