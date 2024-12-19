import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { ReviewDto } from '../../review/dto/review.dto';
import { REVIEWS_PAGE_SIZE } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { getMockReview, mockReview, mockUser } from '@/utils/unit-test';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { ReviewCountDto } from './dto/review-count.dto';
import { ReviewsWithReviwerDto } from './dto/reviews-with-reviewer.dto';
import { ProductReviewController } from './product-review.controller';
import { ProductReviewService } from './product-review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { OrderBy, ReviewsWithReviewerData, SortBy } from '@/types/review.type';

describe('ProductReviewController', () => {
  let controller: ProductReviewController;
  let service: DeepMockProxy<ProductReviewService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductReviewController],
      providers: [
        { provide: ProductReviewService, useValue: mockDeep<ProductReviewService>() },
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() }
      ]
    }).compile();

    controller = module.get(ProductReviewController);
    service = module.get(ProductReviewService);
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

  describe('findMany', () => {
    it('should return an instance of ReviewsDto', async () => {
      const sortBy: SortBy = 'createdAt';
      const orderBy: OrderBy = 'desc';
      const page = 1;
      const mockReviewsWithReviewerData: ReviewsWithReviewerData = {
        reviews: [
          {
            ...mockReview,
            reviewer: mockUser
          }
        ],
        pageSize: REVIEWS_PAGE_SIZE,
        total: 1,
        totalPages: 1
      };
      service.findMany.mockResolvedValue(mockReviewsWithReviewerData);
      const getReviewsDto: FindReviewsDto = { sortBy, orderBy, page };
      const result = await controller.findMany(mockReview.productId, getReviewsDto);
      expect(result).toBeInstanceOf(ReviewsWithReviwerDto);
    });
  });

  describe('count', () => {
    it('should return an instance of ReviewCountDto', async () => {
      service.count.mockResolvedValue({ count: 5 });
      const result = await controller.count(1);
      expect(result).toBeInstanceOf(ReviewCountDto);
    });
  });
});
