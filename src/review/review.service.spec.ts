import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { S3Service } from '@/s3/s3.service';
import { calculateSkip } from '@/utils/page';
import { mockReview, mockReviewIncludeImgsUrl, mockReviewWithImgs } from '@/utils/unit-test';

import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: S3Service, useValue: mockDeep<S3Service>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    service = module.get(ReviewService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a review', async () => {
      prismaService.review.findUnique.mockResolvedValue(mockReviewIncludeImgsUrl);
      const result = await service.findOne(mockReview.id);
      expect(result).toEqual(mockReviewWithImgs);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    it('should pass correct take and skip values to prismaService', async () => {
      const page = 1;
      prismaService.review.findMany.mockResolvedValue([mockReviewIncludeImgsUrl]);
      await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        mockReview.userId
      );
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: REVIEWS_PAGE_SIZE,
          skip: calculateSkip(page, REVIEWS_PAGE_SIZE)
        })
      );
    });

    it('should default to sorting by highest rating', async () => {
      const findReviewsDto: FindReviewsDto = {
        page: 1
      };
      prismaService.review.findMany.mockResolvedValue([mockReviewIncludeImgsUrl]);
      await service.findSortedAndPaginatedReviews(findReviewsDto, mockReview.userId);
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { id: 'desc' }]
        })
      );
    });

    it('should return reviews', async () => {
      prismaService.review.findMany.mockResolvedValue([mockReviewIncludeImgsUrl]);
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page: 1
        },
        mockReview.userId
      );
      expect(result).toEqual([mockReviewIncludeImgsUrl]);
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
        prismaService.review.findMany.mockResolvedValue([mockReviewIncludeImgsUrl]);
        await service.findSortedAndPaginatedReviews(
          {
            sortBy,
            orderBy,
            page
          },
          mockReview.userId
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
      const reviewsData: ReviewsData = {
        reviews: [mockReviewWithImgs],
        pageSize: REVIEWS_PAGE_SIZE,
        total,
        totalPages: 1
      };
      service.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue([mockReviewWithImgs]);
      prismaService.review.count.mockResolvedValue(total);
      const result = await service.findMany(findReviewsDto, mockReview.userId);
      expect(result).toEqual(reviewsData);
    });
  });

  describe('count', () => {
    it('should return user review count', async () => {
      const count = 5;
      prismaService.review.count.mockResolvedValue(count);
      const result = await service.count('1');
      expect(result).toEqual({ count });
    });
  });

  describe('update', () => {
    it('should return a review', async () => {
      const updateReviewDto: UpdateReviewDto = { text: mockReview.text, rating: mockReview.rating };
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.review.update.mockResolvedValue(mockReviewIncludeImgsUrl);
      const result = await service.update({
        userId: mockReview.userId,
        updateReviewDto,
        id: mockReview.id
      });
      expect(result).toEqual(mockReviewIncludeImgsUrl);
    });

    it('should call prisma transaction method when rating is changed', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: mockReview.rating < 5 ? mockReview.rating + 1 : 4
      };
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.$transaction.mockResolvedValue(mockReviewIncludeImgsUrl);
      await service.update({
        userId: mockReview.userId,
        updateReviewDto,
        id: mockReview.id
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should call prisma update method when rating is not changed', async () => {
      const updateReviewDto: UpdateReviewDto = {
        rating: mockReview.rating
      };
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.review.update.mockResolvedValue(mockReviewIncludeImgsUrl);
      await service.update({
        userId: mockReview.userId,
        updateReviewDto,
        id: mockReview.id
      });
      expect(prismaService.review.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(
        service.update({ userId: '1234567890', updateReviewDto, id: 1 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      return expect(
        service.update({
          userId: 'another-user',
          updateReviewDto,
          id: mockReview.id
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call prisma transaction method when the review exists', async () => {
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      prismaService.reviewImg.findMany.mockResolvedValue([]);
      await service.remove(mockReview.userId, mockReview.id);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.remove('1234567890', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      prismaService.review.findUnique.mockResolvedValue(mockReview);
      return expect(service.remove('0987654321', mockReview.id)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
