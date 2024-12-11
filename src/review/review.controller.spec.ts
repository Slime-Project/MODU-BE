import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { GetReviewResDto } from '@/review/dto/get-review-res.dto';
import { GetReviewsReqQueryDto } from '@/review/dto/get-reviews-req-query.dto';
import { GetReviewsResDto } from '@/review/dto/get-reviews-res.dto';
import { PatchReviewReqDto } from '@/review/dto/patch-review-req.dto';
import { PatchReviewResDto } from '@/review/dto/patch-review-res.dto';
import { ReviewService } from '@/review/review.service';
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
    it('should return an instance of CreateReviewResDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const body: CreateReviewReqDto = { text: review.text, rating: review.rating };
      service.create.mockResolvedValue(review);
      const result = await controller.create(req, body, review.productId);
      expect(result).toBeInstanceOf(CreateReviewResDto);
    });
  });

  describe('delete', () => {
    it('should call delete method of reviewService', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.delete.mockResolvedValue(review);
      await controller.delete(req, review.productId, review.id);
      expect(service.delete).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return an instance of GetReviewResDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.findOne.mockResolvedValue(review);
      const result = await controller.get(req, review.productId, review.id);
      expect(result).toBeInstanceOf(GetReviewResDto);
    });
  });

  describe('getMany', () => {
    it('should return an instance of GetReviewsResDto', async () => {
      const review = getMockReview();
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: [review],
        meta: { page, pageSize: REVIEW_PAGE_SIZE, totalReviews: 1, totalPages: 1 }
      };
      service.findMany.mockResolvedValue(reviewsData);
      const query: GetReviewsReqQueryDto = { sortBy, orderBy, page };
      const result = await controller.getMany(review.productId, query);
      expect(result).toBeInstanceOf(GetReviewsResDto);
    });
  });

  describe('patch', () => {
    it('should return an instance of PatchReviewResDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const reqBody: PatchReviewReqDto = {
        text: review.text,
        rating: review.rating
      };
      service.update.mockResolvedValue(review);
      const result = await controller.patch(req, reqBody, review.productId, review.id);
      expect(result).toBeInstanceOf(PatchReviewResDto);
    });
  });
});
