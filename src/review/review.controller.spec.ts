import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Review } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { ReviewService } from '@/review/review.service';

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
      const id = 1234567890;
      const review: Review = {
        id: 1,
        productId: 1,
        userId: BigInt(id),
        text: '',
        rating: 2,
        createdAt: new Date()
      };
      const req = {
        id
      } as RefreshTokenGuardReq;
      const body: CreateReviewReqDto = { text: review.text, rating: review.rating };
      service.create.mockResolvedValue(review);
      const result = await controller.create(req, body, review.productId);
      expect(result).toEqual({ ...review, userId: Number(review.userId) });
    });
  });
});
