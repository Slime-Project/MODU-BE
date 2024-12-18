import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { WISHLIST_PRODUCTS_PAGE_SIZE } from '@/constants/page';
import { PrismaService } from '@/prisma/prisma.service';
import { getMockProduct, getMockWishlistItem } from '@/utils/unit-test';
import { FindWishlistProductsDto } from '@/wishlist/product/dto/find-wishlist-products.dto';

import { WishlistProductService } from './wishlist-product.service';

import { WishlistProductsData } from '@/types/wishlist.type';

describe('WishlistProductService', () => {
  let service: WishlistProductService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WishlistProductService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() }
      ]
    }).compile();

    service = module.get(WishlistProductService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a review', async () => {
      const userId = '1';
      const product = getMockProduct();
      const updatedProduct = { ...product, wishedCount: product.wishedCount + 1 };
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

    describe('remove', () => {
      it('should call prisma delete method when the product exists in the wishlist', async () => {
        const userId = '1';
        const product = getMockProduct();
        const wishlistItem = getMockWishlistItem(userId, product.id);
        prismaService.wishlistItem.findUnique.mockResolvedValue(wishlistItem);
        prismaService.$transaction.mockResolvedValue([product, wishlistItem]);
        await service.remove(userId, product.id);
        expect(prismaService.wishlistItem.delete).toHaveBeenCalled();
      });

      it('should throw a NotFoundException if the product is not present in the wishlist', async () => {
        prismaService.wishlistItem.findUnique.mockResolvedValue(null);
        return expect(service.remove('1', 1)).rejects.toThrow(NotFoundException);
      });
    });

    describe('findMany', () => {
      it('should return wishlist products data', async () => {
        const product = getMockProduct();
        const findWishlistProductsDto: FindWishlistProductsDto = {
          page: 1
        };
        const total = 1;
        const wishlistProductsData: WishlistProductsData = {
          products: [product],
          pageSize: WISHLIST_PRODUCTS_PAGE_SIZE,
          total: 1,
          totalPages: 1
        };
        prismaService.product.findMany.mockResolvedValue([product]);
        prismaService.product.count.mockResolvedValue(total);
        const result = await service.findMany('1', findWishlistProductsDto);
        expect(result).toEqual(wishlistProductsData);
      });
    });
  });
});
