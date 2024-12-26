import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEW_IMGS_ORDER_BY, REVIEWS_PAGE_SIZE } from '@/constants/review';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { S3Service } from '@/s3/s3.service';
import { calculateSkip } from '@/utils/page';
import {
  reviewMock,
  reviewIncludeImgsUrlMock,
  reviewMockWithImgs,
  reviewIncludeImgsMock,
  reviewImgsMock,
  fileMock
} from '@/utils/unit-test';

import { FindReviewsDto } from './dto/find-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: DeepMockProxy<PrismaService>;
  let s3Service: DeepMockProxy<S3Service>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: S3Service, useValue: mockDeep<S3Service>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: KakaoLoginService, useValue: mockDeep<KakaoLoginService>() }
      ]
    }).compile();

    service = module.get(ReviewService);
    s3Service = module.get(S3Service);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a review', async () => {
      prismaService.review.findUnique.mockResolvedValue(reviewIncludeImgsUrlMock);
      const result = await service.findOne(reviewMock.id);
      expect(result).toEqual(reviewMockWithImgs);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    it('should pass correct take and skip values to prismaService', async () => {
      const page = 1;
      prismaService.review.findMany.mockResolvedValue([reviewIncludeImgsUrlMock]);
      await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        { userId: reviewMock.userId }
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
      prismaService.review.findMany.mockResolvedValue([reviewIncludeImgsUrlMock]);
      await service.findSortedAndPaginatedReviews(findReviewsDto, { userId: reviewMock.userId });
      expect(prismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { id: 'desc' }]
        })
      );
    });

    it('should return reviews', async () => {
      prismaService.review.findMany.mockResolvedValue([reviewIncludeImgsUrlMock]);
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page: 1
        },
        { userId: reviewMock.userId }
      );
      expect(result).toEqual([reviewIncludeImgsUrlMock]);
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
        prismaService.review.findMany.mockResolvedValue([reviewIncludeImgsUrlMock]);
        await service.findSortedAndPaginatedReviews(
          {
            sortBy,
            orderBy,
            page
          },
          { userId: reviewMock.userId }
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
        reviews: [reviewMockWithImgs],
        pageSize: REVIEWS_PAGE_SIZE,
        total,
        totalPages: 1
      };
      service.findSortedAndPaginatedReviews = jest.fn().mockResolvedValue([reviewMockWithImgs]);
      prismaService.review.count.mockResolvedValue(total);
      const result = await service.findUserReviews(findReviewsDto, reviewMock.userId);
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

  describe('updateImgsOrder', () => {
    it('should update the order of imgs correctly', async () => {
      prismaService.reviewImg.update.mockResolvedValueOnce({ ...reviewImgsMock[2], order: 2 });
      await ReviewService.updateImgsOrder({
        prisma: prismaService,
        reviewImgs: reviewImgsMock,
        reorderedImgsUrl: [reviewImgsMock[0].url, reviewImgsMock[2].url]
      });
      expect(prismaService.reviewImg.update).toHaveBeenCalledTimes(1);
      expect(prismaService.reviewImg.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { order: 2 }
      });
    });
  });

  describe('deleteReviewImgs', () => {
    it('should delete the review imgs', async () => {
      await ReviewService.deleteReviewImgs(prismaService, [1, 2]);
      expect(prismaService.reviewImg.deleteMany).toHaveBeenCalled();
    });
  });

  describe('deleteAllReviewImgs', () => {
    it('should delete all review images for a given reviewId', async () => {
      const reviewId = 1;
      await ReviewService.deleteAllReviewImgs(prismaService, reviewId);
      expect(prismaService.reviewImg.deleteMany).toHaveBeenCalledWith({
        where: {
          reviewId
        }
      });
    });
  });

  describe('updateImgs', () => {
    it('should call deleteAllReviewImgs if imgs is undefined', async () => {
      ReviewService.deleteAllReviewImgs = jest.fn();
      await service.updateImgs({
        prisma: prismaService,
        review: reviewIncludeImgsMock,
        imgs: undefined
      });
      expect(ReviewService.deleteAllReviewImgs).toHaveBeenCalled();
    });

    it('should call deleteReviewImgs and updateImgsOrder if imgs is provided', async () => {
      ReviewService.deleteReviewImgs = jest.fn();
      ReviewService.updateImgsOrder = jest.fn();
      await service.updateImgs({
        prisma: prismaService,
        review: reviewIncludeImgsMock,
        imgs: ['URL']
      });
      expect(ReviewService.deleteReviewImgs).toHaveBeenCalled();
      expect(ReviewService.updateImgsOrder).toHaveBeenCalled();
    });

    it('should call createImgs when new img files are provided', async () => {
      ReviewService.deleteReviewImgs = jest.fn();
      ReviewService.updateImgsOrder = jest.fn();
      service.createImgs = jest.fn().mockResolvedValue(['URL']);
      await service.updateImgs({
        prisma: prismaService,
        review: reviewIncludeImgsMock,
        newImgs: [fileMock]
      });
      expect(service.createImgs).toHaveBeenCalled();
    });

    it('should return updated imgs url', async () => {
      const imgs = ['URL'];
      const newImgsUrl = ['URL2'];
      service.createImgs = jest.fn().mockResolvedValue(newImgsUrl);
      const result = await service.updateImgs({
        prisma: prismaService,
        review: reviewIncludeImgsMock,
        imgs,
        newImgs: [fileMock]
      });
      expect(result).toEqual([...imgs, ...newImgsUrl]);
    });
  });

  describe('update', () => {
    it('should return a review', async () => {
      const updateReviewDto: UpdateReviewDto = { text: reviewMock.text, rating: reviewMock.rating };
      prismaService.review.findUnique.mockResolvedValue(reviewIncludeImgsMock);
      prismaService.$transaction.mockResolvedValue(reviewIncludeImgsUrlMock);
      const result = await service.update({
        userId: reviewMock.userId,
        updateReviewDto,
        reviewId: reviewMock.id
      });
      expect(result).toEqual(reviewIncludeImgsUrlMock);
    });

    it('should order imgs when finding review', async () => {
      const updateReviewDto: UpdateReviewDto = { text: reviewMock.text, rating: reviewMock.rating };
      prismaService.review.findUnique.mockResolvedValue(reviewIncludeImgsMock);
      prismaService.$transaction.mockResolvedValue(reviewIncludeImgsUrlMock);
      await service.update({
        userId: reviewMock.userId,
        updateReviewDto,
        reviewId: reviewMock.id
      });
      expect(prismaService.review.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            imgs: {
              orderBy: REVIEW_IMGS_ORDER_BY
            }
          }
        })
      );
    });

    it('should delete unused file paths from S3', async () => {
      const updateReviewDto: UpdateReviewDto = { text: reviewMock.text, rating: reviewMock.rating };
      prismaService.review.findUnique.mockResolvedValue(reviewIncludeImgsMock);
      prismaService.$transaction.mockResolvedValue(reviewIncludeImgsUrlMock);
      await service.update({
        userId: reviewMock.userId,
        updateReviewDto,
        reviewId: reviewMock.id
      });
      expect(s3Service.deleteImgFromS3).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.update({ userId: '1', updateReviewDto, reviewId: 1 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const updateReviewDto: UpdateReviewDto = { text: 'new-text', rating: 5 };
      const anotherUserId = `${reviewMock.userId}0`;
      prismaService.review.findUnique.mockResolvedValue(reviewIncludeImgsMock);
      return expect(
        service.update({
          userId: anotherUserId,
          updateReviewDto,
          reviewId: reviewMock.id
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call prisma transaction method when the review exists', async () => {
      prismaService.review.findUnique.mockResolvedValue(reviewMock);
      prismaService.reviewImg.findMany.mockResolvedValue([]);
      await service.remove(reviewMock.userId, reviewMock.id);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(service.remove('1234567890', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      prismaService.review.findUnique.mockResolvedValue(reviewMock);
      return expect(service.remove('0987654321', reviewMock.id)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
