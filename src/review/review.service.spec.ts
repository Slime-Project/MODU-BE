import { Test } from '@nestjs/testing';
import { Review } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';

import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ReviewService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }]
    }).compile();

    prismaService = module.get(PrismaService);
    reviewService = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(reviewService).toBeDefined();
  });

  describe('create', () => {
    it('should return a review', async () => {
      const review: Review = {
        id: 1,
        productId: 1,
        userId: BigInt(1234567890),
        text: '',
        rating: 2,
        createdAt: new Date()
      };
      prismaService.review.create.mockResolvedValue(review);
      const result = await reviewService.create(review);
      expect(result).toEqual(review);
    });
  });
});
