import { UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { ReviewCountDto } from '@/review/dto/review-count.dto';
import { fileMock, reviewMock, reviewMockWithImgs } from '@/utils/unit-test';

import { ReviewDto } from './dto/review.dto';
import { ReviewsDto } from './dto/reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: DeepMockProxy<ReviewService>;
  const isValidFileContent = mockDeep<typeof isValidFileContent>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        { provide: ReviewService, useValue: mockDeep<ReviewService>() },
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() }
      ]
    }).compile();

    service = module.get(ReviewService);
    controller = module.get(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an instance of ReviewDto', async () => {
      service.findOne.mockResolvedValue(reviewMockWithImgs);
      const result = await controller.findOne(reviewMock.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('findMany', () => {
    it('should return an instance of ReviewsDto', async () => {
      const req = {
        id: reviewMock.userId
      } as TokenGuardReq;
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: [reviewMockWithImgs],
        pageSize: REVIEWS_PAGE_SIZE,
        total: 1,
        totalPages: 1
      };
      service.findMany.mockResolvedValue(reviewsData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findMany(req, getReviewsDto);
      expect(result).toBeInstanceOf(ReviewsDto);
    });
  });

  describe('count', () => {
    it('should return an instance of ReviewCountDto', async () => {
      service.count.mockResolvedValue({ count: 5 });
      const req = {
        id: '1'
      } as TokenGuardReq;
      const result = await controller.count(req);
      expect(result).toBeInstanceOf(ReviewCountDto);
    });
  });

  describe('update', () => {
    it('should return an instance of ReviewDto', async () => {
      const req = {
        id: reviewMock.userId
      } as TokenGuardReq;
      const updateReviewDto: UpdateReviewDto = {
        text: reviewMock.text,
        rating: reviewMock.rating
      };
      service.update.mockResolvedValue(reviewMockWithImgs);
      const result = await controller.update(req, updateReviewDto, reviewMock.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });

    it('should UnsupportedMediaTypeException when file content is not valid', async () => {
      const req = {
        id: reviewMock.userId
      } as TokenGuardReq;
      const updateReviewDto: UpdateReviewDto = {
        text: reviewMock.text,
        rating: reviewMock.rating
      };
      service.update.mockResolvedValue(reviewMockWithImgs);
      isValidFileContent.mockReturnValue(false);
      return expect(
        controller.update(req, updateReviewDto, reviewMock.id, [fileMock])
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });
  });

  describe('remove', () => {
    it('should call remove method of reviewService', async () => {
      const req = {
        id: reviewMock.userId
      } as TokenGuardReq;
      await controller.remove(req, reviewMock.id);
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
