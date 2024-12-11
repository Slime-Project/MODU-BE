import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { PatchReviewReqDto } from '@/review/dto/patch-review-req.dto';
import { sanitizeReview, sanitizeReviews } from '@/utils/review';
import { getMockReview } from '@/utils/unit-test';

import { ReviewService } from './review.service';

import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ReviewService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }]
    }).compile();

    prismaService = module.get(PrismaService);
    reviewService = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(reviewService).toBeDefined();
  });

  describe('create', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      prismaService.review.findUnique.mockResolvedValue(null);
      prismaService.review.create.mockResolvedValue(review);
      const result = await reviewService.create(review);
      expect(result).toEqual(sanitizedReview);
    });

    it('should throw ConflictException when user has already submitted a review for this product', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(reviewService.create(review)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.delete.mockResolvedValue(review);
      const result = await reviewService.delete(review.userId, review.productId, review.id);
      expect(result).toEqual(sanitizedReview);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(reviewService.delete('1234567890', 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.delete('0987654321', review.productId, review.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      prismaService.review.findUnique.mockResolvedValue(review);
      const result = await reviewService.findOne(review.userId, review.productId, review.id);
      expect(result).toEqual(sanitizedReview);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(reviewService.delete('1234567890', 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.findOne('another-user', review.productId, review.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    it('should pass correct take and skip values to prismaService', async () => {
      const review = getMockReview();
      const page = 1;
      prismaService.review.findMany.mockResolvedValue([review]);
      await reviewService.findSortedAndPaginatedReviews({
        productId: review.productId,
        sortBy: 'createdAt',
        orderBy: 'desc',
        page
      });
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: REVIEW_PAGE_SIZE,
          skip: (page - 1) * REVIEW_PAGE_SIZE
        })
      );
    });

    it('should return sanitized reviews', async () => {
      const review = getMockReview();
      const sanitizedReviews = sanitizeReviews([review]);
      prismaService.review.findMany.mockResolvedValue([review]);
      const result = await reviewService.findSortedAndPaginatedReviews({
        productId: review.productId,
        sortBy: 'createdAt',
        orderBy: 'desc',
        page: 1
      });
      expect(result).toEqual(sanitizedReviews);
    });

    it.each([
      ['createdAt', 'desc'],
      ['createdAt', 'asc'],
      ['rating', 'desc'],
      ['rating', 'asc']
    ])(
      'should pass correct orderBy options for %s %s',
      async (sortBy: SortBy, orderBy: OrderBy) => {
        const review = getMockReview();
        const page = 1;
        prismaService.review.findMany.mockResolvedValue([review]);
        await reviewService.findSortedAndPaginatedReviews({
          productId: review.productId,
          sortBy,
          orderBy,
          page
        });
        expect(prismaService.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: expect.arrayContaining([
              expect.objectContaining({ [sortBy]: orderBy }),
              expect.objectContaining({ id: 'desc' })
            ])
          })
        );
      }
    );
  });

  describe('findMany', () => {
    it('should return reviews data', async () => {
      const review = getMockReview();
      const sanitizedReviews = sanitizeReviews([review]);
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const totalReviews = 1;
      const reviewsData: ReviewsData = {
        reviews: sanitizedReviews,
        meta: { page, pageSize: REVIEW_PAGE_SIZE, totalReviews, totalPages: 1 }
      };
      prismaService.product.findUnique.mockResolvedValue({ id: review.productId } as Product);
      reviewService.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue(sanitizedReviews);
      prismaService.review.count.mockResolvedValue(totalReviews);
      const result = await reviewService.findMany({
        productId: review.productId,
        sortBy,
        orderBy,
        page
      });
      expect(result).toEqual(reviewsData);
    });

    it('should use default values for sortBy and orderBy', async () => {
      const review = getMockReview();
      const sanitizedReviews = sanitizeReviews([review]);
      const page = 1;
      const totalReviews = 1;
      prismaService.product.findUnique.mockResolvedValue({ id: review.productId } as Product);
      reviewService.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue(sanitizedReviews);
      prismaService.review.count.mockResolvedValue(totalReviews);
      await reviewService.findMany({
        productId: review.productId,
        page
      });
      expect(reviewService.findSortedAndPaginatedReviews).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: 'desc', sortBy: 'rating' })
      );
    });

    it('should throw NotFoundException when product is not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(
        reviewService.findMany({
          productId: 1,
          sortBy: 'rating',
          orderBy: 'desc',
          page: 1
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      const data: PatchReviewReqDto = { text: review.text, rating: review.rating };
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.update.mockResolvedValue(review);
      const result = await reviewService.update({
        userId: review.userId,
        data,
        productId: review.productId,
        id: review.id
      });
      expect(result).toEqual(sanitizedReview);
    });

    it('should throw NotFoundException when review is not found', async () => {
      const data: PutReviewReqDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(
        reviewService.update({ userId: '1234567890', data, productId: 1, id: 1 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      const data: PutReviewReqDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.update({
          userId: 'another-user',
          data,
          productId: review.productId,
          id: review.id
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
