import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewImgsDto } from '@/review-img/dto/find-review-imgs.dto';
import { ReviewImgsDto } from '@/review-img/dto/review-imgs.dto';
import { ReviewImgService } from '@/review-img/review-img.service';
import { reviewImgsDataMock, reviewMock } from '@/utils/unit-test';

import { ReviewImgController } from './review-img.controller';

describe('ReviewImgController', () => {
  let controller: ReviewImgController;
  let service: DeepMockProxy<ReviewImgService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReviewImgController],
      providers: [
        { provide: ReviewImgService, useValue: mockDeep<ReviewImgService>() },
        { provide: PrismaService, useValue: mockDeep<PrismaService>() }
      ]
    }).compile();

    service = module.get(ReviewImgService);
    controller = module.get(ReviewImgController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findProductReviews', () => {
    it('should return an instance of ReviewsDto', async () => {
      service.findMany.mockResolvedValue(reviewImgsDataMock);
      const findReviewImgsDto: FindReviewImgsDto = { page: 1 };
      const result = await controller.findMany(reviewMock.productId, findReviewImgsDto);
      expect(result).toBeInstanceOf(ReviewImgsDto);
    });
  });
});
