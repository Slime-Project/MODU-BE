import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';
import { getMockReview } from '@/utils/unit-test';

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
      const review = getMockReview();
      prismaService.review.create.mockResolvedValue(review);
      const result = await reviewService.create(review);
      expect(result).toEqual(review);
    });
  });

  describe('delete', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      prismaService.review.delete.mockResolvedValue(review);
      const result = await reviewService.delete(review.userId, review.productId, review.id);
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(reviewService.delete('1234567890', 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(
        reviewService.delete('0987654321', review.productId, review.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('get', () => {
    it('should return a review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      const result = await reviewService.get(review.userId, review.productId, review.id);
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException when review is not found', async () => {
      prismaService.review.findUnique.mockResolvedValue(null);
      return expect(reviewService.delete('1234567890', 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not authorized to delete the review', async () => {
      const review = getMockReview();
      prismaService.review.findUnique.mockResolvedValue(review);
      return expect(reviewService.get('another-user', review.productId, review.id)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
