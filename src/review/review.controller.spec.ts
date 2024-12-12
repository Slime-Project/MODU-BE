import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewResDto } from '@/review/dto/find-review-res.dto';
import { FindReviewsResDto } from '@/review/dto/find-reviews-res.dto';
import { FindReviewsDto } from '@/review/dto/find-reviews.dto';
import { UpdateReviewResDto } from '@/review/dto/update-review-res.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
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
      const body: CreateReviewDto = { text: review.text, rating: review.rating };
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

  describe('findOne', () => {
    it('should return an instance of FindReviewResDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.findOne.mockResolvedValue(review);
      const result = await controller.findOne(req, review.productId, review.id);
      expect(result).toBeInstanceOf(FindReviewResDto);
    });
  });

  describe('findMany', () => {
    it('should return an instance of FindReviewsResDto', async () => {
      const review = getMockReview();
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: [review],
        meta: { page, pageSize: REVIEWS_PAGE_SIZE, totalReviews: 1, totalPages: 1 }
      };
      service.findMany.mockResolvedValue(reviewsData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findMany(review.productId, getReviewsDto);
      expect(result).toBeInstanceOf(FindReviewsResDto);
    });
  });

  describe('update', () => {
    it('should return an instance of UpdateReviewResDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const updateReviewDto: UpdateReviewDto = {
        text: review.text,
        rating: review.rating
      };
      service.update.mockResolvedValue(review);
      const result = await controller.update(req, updateReviewDto, review.productId, review.id);
      expect(result).toBeInstanceOf(UpdateReviewResDto);
    });
  });
});
