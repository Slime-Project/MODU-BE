import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { calculateSkip } from '@/utils/page';
import { getMockReview } from '@/utils/unit-test';

import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ReviewService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }]
    }).compile();

    service = module.get(ReviewService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      const result = await service.findOne(review.userId, review.id);
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.findOne('1234567890', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to get the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(service.findOne('another-user', review.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    it('should pass correct take and skip values to prismaService', async () => {
      const review = getMockReview();
      const page = 1;
      prismaService.review.findMany.mockResolvedValue([review]);
      await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        review.userId
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
      await service.findSortedAndPaginatedReviews(findReviewsDto, review.userId);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { id: 'desc' }]
        })
      );
    });

    it('should return reviews', async () => {
      const review = getMockReview();
      prismaService.review.findMany.mockResolvedValue([review]);
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page: 1
        },
        review.userId
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
        await service.findSortedAndPaginatedReviews(
          {
            sortBy,
            orderBy,
            page
          },
          review.userId
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
      service.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue([review]);
      prismaService.review.count.mockResolvedValue(total);
      const result = await service.findMany(findReviewsDto, review.userId);
      expect(result).toEqual(reviewsData);
    });
  });

  describe('update', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      const updateReviewDto: UpdateReviewDto = { text: review.text, rating: review.rating };
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.update.mockResolvedValue(review);
      const result = await service.update({
        userId: review.userId,
        updateReviewDto,
        id: review.id
      });
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when review is not found', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(
        service.update({ userId: '1234567890', updateReviewDto, id: 1 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        service.update({
          userId: 'another-user',
          updateReviewDto,
          id: review.id
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call prisma delete method when the review exists', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.delete.mockResolvedValue(review);
      await service.remove(review.userId, review.id);
      expect(prismaService.review.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.remove('1234567890', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(service.remove('0987654321', review.id)).rejects.toThrow(ForbiddenException);
    });
  });
});
