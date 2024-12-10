import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { GetReviewsReqQueryDto } from '@/review/dto/get-reviews-req-query.dto';
import { PutReviewReqDto } from '@/review/dto/put-review-req.dto';
import { ReviewService } from '@/review/review.service';
import { sanitizeReview, sanitizeReviews } from '@/utils/review';
import { getMockReview } from '@/utils/unit-test';

import { ReviewController } from './review.controller';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';
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
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const body: CreateReviewReqDto = { text: review.text, rating: review.rating };
      service.create.mockResolvedValue(sanitizedReview);
      const result = await controller.create(req, body, review.productId);
      expect(result).toEqual(sanitizedReview);
    });
  });

  describe('delete', () => {
    it('should call delete method of reviewService', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.delete.mockResolvedValue(sanitizedReview);
      await controller.delete(req, review.productId, review.id);
      expect(service.delete).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const sanitizedReview = sanitizeReview(review);
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.findOne.mockResolvedValue(sanitizedReview);
      const result = await controller.get(req, review.productId, review.id);
      expect(result).toEqual(sanitizedReview);
    });
  });

  describe('getMany', () => {
    it('should return reviews data', async () => {
      const review = getMockReview();
      const sanitizedReviews = sanitizeReviews([review]);
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: sanitizedReviews,
        meta: { page, pageSize: REVIEW_PAGE_SIZE, totalReviews: 1, totalPages: 1 }
      };
      service.findMany.mockResolvedValue(reviewsData);
      const query: GetReviewsReqQueryDto = { sortBy, orderBy, page };
      const result = await controller.getMany(review.productId, query);
      expect(result).toEqual(reviewsData);
    });
  });

  describe('patch', () => {
    it('should return a sanitized review', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const reqBody: PutReviewReqDto = {
        text: review.text,
        rating: review.rating
      };
      const sanitizedReview = sanitizeReview(review);
      service.update.mockResolvedValue(sanitizedReview);
      const result = await controller.patch(req, reqBody, review.productId, review.id);
      expect(result).toEqual(sanitizedReview);
    });
  });
});
