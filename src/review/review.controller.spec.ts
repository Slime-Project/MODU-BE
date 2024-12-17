import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { ReviewsDto } from '@/product/review/dto/reviews.dto';
import { getMockReview } from '@/utils/unit-test';

import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

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

    service = module.get(ReviewService);
    controller = module.get(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an instance of ReviewDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      service.findOne.mockResolvedValue(review);
      const result = await controller.findOne(req, review.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('findMany', () => {
    it('should return an instance of ReviewsDto', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
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
      const result = await controller.findMany(req, getReviewsDto);
      expect(result).toBeInstanceOf(ReviewsDto);
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
      const result = await controller.update(req, updateReviewDto, review.id);
      expect(result).toBeInstanceOf(ReviewDto);
    });
  });

  describe('remove', () => {
    it('should call remove method of reviewService', async () => {
      const review = getMockReview();
      const req = {
        id: review.userId
      } as TokenGuardReq;
      await controller.remove(req, review.id);
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
