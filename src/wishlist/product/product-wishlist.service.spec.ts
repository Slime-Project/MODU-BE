import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';
import { getMockProduct, getMockWishlistItem } from '@/utils/unit-test';

import { ProductWishlistService } from './product-wishlist.service';

describe('ProductWishlistService', () => {
  let service: ProductWishlistService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductWishlistService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() }
      ]
    }).compile();

    service = module.get(ProductWishlistService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a review', async () => {
      const userId = '1';
      const product = getMockProduct();
      const updatedProduct = { ...product, likedCount: product.likedCount + 1 };
      const wishlistItem = getMockWishlistItem(userId, product.id);
      prismaService.product.findUnique.mockResolvedValue(product);
      prismaService.wishlistItem.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue([updatedProduct, wishlistItem]);
      const result = await service.create(userId, product.id);
      expect(result).toEqual({ product: updatedProduct });
    });

    it('should throw NotFoundException when product is not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(service.create('1', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user has already added this product to the wishlist', async () => {
      const userId = '1';
      const product = getMockProduct();
      const wishlistItem = getMockWishlistItem(userId, product.id);
      prismaService.product.findUnique.mockResolvedValue(product);
      prismaService.wishlistItem.findUnique.mockResolvedValue(wishlistItem);
      return expect(service.create(userId, product.id)).rejects.toThrow(ConflictException);
    });
  });
});
