import { UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewsWithReviwerDto } from '@/review/dto/reviews-with-reviewer.dto';
import { fileMock, userInfoMock, reviewMock, reviewMockWithImgs } from '@/utils/unit-test';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { ReviewCountDto } from './dto/review-count.dto';
import { ReviewDto } from './dto/review.dto';
import { ReviewsDto } from './dto/reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { OrderBy, ReviewsData, ReviewsWithReviewerData, SortBy } from '@/types/review.type';

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

  describe('create', () => {
    it('should return an instance of ReviewDto', async () => {
      const req = {
        id: reviewMock.userId
      } as TokenGuardReq;
      const body: CreateReviewDto = { text: reviewMock.text, rating: reviewMock.rating };
      service.create.mockResolvedValue(reviewMockWithImgs);
      const result = await controller.create(req, body, reviewMock.productId, []);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('findOne', () => {
    it('should return an instance of ReviewDto', async () => {
      service.findOne.mockResolvedValue(reviewMockWithImgs);
      const result = await controller.findOne(reviewMock.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('findProductReviews', () => {
    it('should return an instance of ReviewsDto', async () => {
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewMocksWithReviewerData: ReviewsWithReviewerData = {
        reviews: [
          {
            ...reviewMockWithImgs,
            reviewer: userInfoMock
          }
        ],
        pageSize: REVIEWS_PAGE_SIZE,
        total: 1,
        totalPages: 1
      };
      service.findProductReviews.mockResolvedValue(reviewMocksWithReviewerData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findProductReviews(reviewMock.productId, getReviewsDto);
      expect(result).toBeInstanceOf(ReviewsWithReviwerDto);
    });
  });

  describe('findUserReviews', () => {
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
      service.findUserReviews.mockResolvedValue(reviewsData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findUserReviews(req, getReviewsDto);
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
