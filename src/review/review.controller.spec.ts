import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { ReviewService } from '@/review/review.service';
import { getMockReview } from '@/utils/unit-test';

import { ReviewController } from './review.controller';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

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
    it('should return a review', async () => {
      const review = getMockReview();
      const res: CreateReviewResDto = {
        id: review.id,
        text: review.text,
        rating: review.rating,
        createdAt: review.createdAt
      };
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      const body: CreateReviewReqDto = { text: review.text, rating: review.rating };
      service.create.mockResolvedValue(review);
      const result = await controller.create(req, body, review.productId);
      expect(result).toEqual(res);
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
    it('should return a review', async () => {
      const review = getMockReview();
      const res: CreateReviewResDto = {
        id: review.id,
        text: review.text,
        rating: review.rating,
        createdAt: review.createdAt
      };
      const req = {
        id: review.userId
      } as RefreshTokenGuardReq;
      service.get.mockResolvedValue(review);
      const result = await controller.get(req, review.productId, review.id);
      expect(result).toEqual(res);
    });
  });
});
