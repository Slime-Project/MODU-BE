import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { calculateSkip } from '@/utils/page';
import { mockProduct, mockReview, mockUser } from '@/utils/unit-test';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { ProductReviewService } from './product-review.service';

import { OrderBy, ReviewsWithReviewerData, SortBy } from '@/types/review.type';

describe('ProductReviewService', () => {
  let service: ProductReviewService;
  let prismaService: DeepMockProxy<PrismaService>;
  let kakaoLoginService: DeepMockProxy<KakaoLoginService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductReviewService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: KakaoLoginService, useValue: mockDeep<KakaoLoginService>() }
      ]
    }).compile();

    prismaService = module.get(PrismaService);
    kakaoLoginService = module.get(KakaoLoginService);
    service = module.get(ProductReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a review', async () => {
      const createReviewDto: CreateReviewDto = { text: mockReview.text, rating: mockReview.rating };
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.review.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(mockReview);
      const result = await service.create(createReviewDto, mockReview.userId, mockReview.productId);
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const createReviewDto: CreateReviewDto = { text: 'test', rating: 5 };
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(service.create(createReviewDto, '1', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user has already submitted a review for this product', async () => {
      const createReviewDto: CreateReviewDto = { text: mockReview.text, rating: mockReview.rating };
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      return expect(
        service.create(createReviewDto, mockReview.userId, mockReview.productId)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    it('should pass correct take and skip values to prismaService', async () => {
      const page = 1;
      prismaService.review.findMany.mockResolvedValue([mockReview]);
      await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        mockReview.productId
      );
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: REVIEWS_PAGE_SIZE,
          skip: calculateSkip(page, REVIEWS_PAGE_SIZE)
        })
      );
    });

    it('sshould default to sorting by highest rating', async () => {
      const findReviewsDto: FindReviewsDto = {
        page: 1
      };
      prismaService.review.findMany.mockResolvedValue([mockReview]);
      await service.findSortedAndPaginatedReviews(findReviewsDto, mockReview.productId);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { id: 'desc' }]
        })
      );
    });

    it('should return reviews', async () => {
      prismaService.review.findMany.mockResolvedValue([mockReview]);
      prismaService.review.findMany.mockResolvedValue([mockReview]);
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page: 1
        },
        mockReview.productId
      );
      expect(result).toEqual([mockReview]);
    });

    it.each([
      ['createdAt', 'desc'],
      ['createdAt', 'asc'],
      ['rating', 'desc'],
      ['rating', 'asc']
    ])(
      'should pass correct orderBy options for %s %s',
      async (sortBy: SortBy, orderBy: OrderBy) => {
        const page = 1;
        prismaService.review.findMany.mockResolvedValue([mockReview]);
        await service.findSortedAndPaginatedReviews(
          {
            sortBy,
            orderBy,
            page
          },
          mockReview.productId
        );
        expect(prismaService.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [
              expect.objectContaining({ [sortBy]: orderBy }),
              expect.objectContaining({ id: 'desc' })
            ]
          })
        );
      }
    );
  });

  describe('findMany', () => {
    it('should return reviews data', async () => {
      const findReviewsDto: FindReviewsDto = {
        page: 1,
        sortBy: 'createdAt',
        orderBy: 'desc'
      };
      const total = 1;
      const mockReviewsWithReviewerData: ReviewsWithReviewerData = {
        reviews: [
          {
            ...mockReview,
            reviewer: mockUser
          }
        ],
        pageSize: REVIEWS_PAGE_SIZE,
        total,
        totalPages: 1
      };
      prismaService.product.findUnique.mockResolvedValue({
        id: mockReview.productId
      } as Product);
      service.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue([mockReview]);
      kakaoLoginService.findUsers.mockResolvedValue([mockUser]);
      prismaService.review.count.mockResolvedValue(total);
      const result = await service.findMany(findReviewsDto, mockReview.productId);
      expect(result).toEqual(mockReviewsWithReviewerData);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const findReviewsDto: FindReviewsDto = {
        page: 1
      };
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(service.findMany(findReviewsDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return product review count', async () => {
      const count = 5;
      prismaService.product.findUnique.mockResolvedValue({} as Product);
      prismaService.review.count.mockResolvedValue(count);
      const result = await service.count(1);
      expect(result).toEqual({ count });
    });

    it('should throw NotFoundException when product is not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(service.count(1)).rejects.toThrow(NotFoundException);
    });
  });
});
