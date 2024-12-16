import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/page';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewsDto } from '@/review/dto/find-reviews.dto';
import { ReviewCountDto } from '@/review/dto/review-count.dto';
import { ReviewDto } from '@/review/dto/review.dto';
import { ReviewsDto } from '@/review/dto/reviews.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { ReviewService } from '@/review/review.service';
import { getMockReview } from '@/utils/unit-test';

import { ReviewController } from './review.controller';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { OrderBy, ReviewsData, SortBy } from '@/types/review.type';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: DeepMockProxy<ReviewService>;

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

    controller = module.get(ReviewController);
    service = module.get(ReviewService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return an instance of ReviewDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      const body: CreateReviewDto = { text: review.text, rating: review.rating };
      service.create.mockResolvedValue(review);
      const result = await controller.create(req, body, review.productId);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('remove', () => {
    it('should call remove method of reviewService', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      service.remove.mockResolvedValue(review);
      await controller.remove(req, review.productId, review.id);
      expect(service.remove).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an instance of ReviewDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      service.findOne.mockResolvedValue(review);
      const result = await controller.findOne(req, review.productId, review.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('findMany', () => {
    it('should return an instance of ReviewsDto', async () => {
      const review = getMockReview();
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: [review],
        pageSize: REVIEWS_PAGE_SIZE,
        total: 1,
        totalPages: 1
      };
      service.findMany.mockResolvedValue(reviewsData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findMany(review.productId, getReviewsDto);
      expect(result).toBeInstanceOf(ReviewsDto);
    });
  });

  describe('count', () => {
    it('should return an instance of ReviewCountDto', async () => {
      service.count.mockResolvedValue({ count: 5 });
      const result = await controller.count(1);
      expect(result).toBeInstanceOf(ReviewCountDto);
    });
  });

  describe('update', () => {
    it('should return an instance of ReviewDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      const updateReviewDto: UpdateReviewDto = {
        text: review.text,
        rating: review.rating
      };
      service.update.mockResolvedValue(review);
      const result = await controller.update(req, updateReviewDto, review.productId, review.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });
});
