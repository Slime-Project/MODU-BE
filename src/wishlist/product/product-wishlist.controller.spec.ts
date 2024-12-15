import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { getMockProduct } from '@/utils/unit-test';
import { ProductWishlistDto } from '@/wishlist/product/dto/product-wishlist.dto';
import { ProductWishlistService } from '@/wishlist/product/product-wishlist.service';

import { ProductWishlistController } from './product-wishlist.controller';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

describe('ProductWishlistController', () => {
  let controller: ProductWishlistController;
  let service: DeepMockProxy<ProductWishlistService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductWishlistController],
      providers: [
        { provide: ProductWishlistService, useValue: mockDeep<ProductWishlistService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() }
      ]
    }).compile();

    controller = module.get(ProductWishlistController);
    service = module.get(ProductWishlistService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return an instance of ProductWishlistDto', async () => {
      const product = getMockProduct();
      const req = {
        id: '1'
      } as TokenGuardReq;
      service.create.mockResolvedValue({ product });
      const result = await controller.create(req, product.id);
      expect(result).toBeInstanceOf(ProductWishlistDto);
    });
  });

  describe('remove', () => {
    it('should call remove method of productWishlistService', async () => {
      const req = {
        id: '1'
      } as TokenGuardReq;
      await controller.remove(req, 1);
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
