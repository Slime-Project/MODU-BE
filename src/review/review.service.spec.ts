import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/page';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewsDto } from '@/review/dto/find-reviews.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { calculateSkip } from '@/utils/page';
import { getMockProduct, getMockReview } from '@/utils/unit-test';

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
    reviewService = module.get(ReviewService);
  });

  it('should be defined', () => {
    expect(reviewService).toBeDefined();
  });

  describe('create', () => {
    it('should return a review', async () => {
      const product = getMockProduct();
      const review = getMockReview();
      const createReviewDto: CreateReviewDto = { text: review.text, rating: review.rating };
      prismaService.product.findUnique.mockResolvedValue(product);
      prismaService.review.findUnique.mockResolvedValue(null);
      prismaService.review.create.mockResolvedValue(review);
      const result = await reviewService.create(createReviewDto, review.userId, review.productId);
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const createReviewDto: CreateReviewDto = { text: 'test', rating: 5 };
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(reviewService.create(createReviewDto, '1', 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException when user has already submitted a review for this product', async () => {
      const product = getMockProduct();
      const review = getMockReview();
      const createReviewDto: CreateReviewDto = { text: review.text, rating: review.rating };
      prismaService.product.findUnique.mockResolvedValue(product);
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.create(createReviewDto, review.userId, review.productId)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.delete.mockResolvedValue(review);
      const result = await reviewService.delete(review.userId, review.productId, review.id);
      expect(result).toEqual(review);
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
    it('should return a review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      const result = await reviewService.findOne(review.userId, review.productId, review.id);
      expect(result).toEqual(review);
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
      await reviewService.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        review.productId
      );
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: REVIEWS_PAGE_SIZE,
          skip: calculateSkip(page, REVIEWS_PAGE_SIZE)
        })
      );
    });

    it('sshould default to sorting by highest rating', async () => {
      const review = getMockReview();
      const findReviewsDto: FindReviewsDto = {
        page: 1
      };
      prismaService.review.findMany.mockResolvedValue([review]);
      await reviewService.findSortedAndPaginatedReviews(findReviewsDto, review.productId);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
        })
      );
    });

    it('should return reviews', async () => {
      const review = getMockReview();
      prismaService.review.findMany.mockResolvedValue([review]);
      const result = await reviewService.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page: 1
        },
        review.productId
      );
      expect(result).toEqual([review]);
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
        await reviewService.findSortedAndPaginatedReviews(
          {
            sortBy,
            orderBy,
            page
          },
          review.productId
        );
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
      const findReviewsDto: FindReviewsDto = {
        page: 1,
        sortBy: 'createdAt',
        orderBy: 'desc'
      };
      const total = 1;
      const reviewsData: ReviewsData = {
        reviews: [review],
        pageSize: REVIEWS_PAGE_SIZE,
        total,
        totalPages: 1
      };
      prismaService.product.findUnique.mockResolvedValue({ id: review.productId } as Product);
      reviewService.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue([review]);
      prismaService.review.count.mockResolvedValue(total);
      const result = await reviewService.findMany(findReviewsDto, review.productId);
      expect(result).toEqual(reviewsData);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const findReviewsDto: FindReviewsDto = {
        page: 1
      };
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(reviewService.findMany(findReviewsDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return review count', async () => {
      const count = 5;
      prismaService.product.findUnique.mockResolvedValue({} as Product);
      prismaService.review.count.mockResolvedValue(count);
      const result = await reviewService.count(1);
      expect(result).toEqual({ count });
    });

    it('should throw NotFoundException when product is not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(reviewService.count(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      const updateReviewDto: UpdateReviewDto = { text: review.text, rating: review.rating };
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.update.mockResolvedValue(review);
      const result = await reviewService.update({
        userId: review.userId,
        updateReviewDto,
        productId: review.productId,
        id: review.id
      });
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when review is not found', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(
        reviewService.update({ userId: '1234567890', updateReviewDto, productId: 1, id: 1 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.update({
          userId: 'another-user',
          updateReviewDto,
          productId: review.productId,
          id: review.id
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
