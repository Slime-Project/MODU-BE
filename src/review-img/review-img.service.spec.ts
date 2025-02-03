import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewImgsDto } from '@/review-img/dto/find-review-imgs.dto';
import {
  kakaoUserInfoDtoMock,
  mockProduct,
  reviewImgsDataMock,
  reviewImgWithReviewAndReviewerMock,
  reviewImgWithReviewMock,
  reviewMock
} from '@/utils/unit-test';

import { ReviewImgService } from './review-img.service';

describe('ReviewImgService', () => {
  let service: ReviewImgService;
  let prismaService: DeepMockProxy<PrismaService>;
  let kakaoLoginService: DeepMockProxy<KakaoLoginService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReviewImgService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: KakaoLoginService, useValue: mockDeep<KakaoLoginService>() }
      ]
    }).compile();

    service = module.get(ReviewImgService);
    prismaService = module.get(PrismaService);
    kakaoLoginService = module.get(KakaoLoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findReviewImgs', () => {
    it('should return review imgs with review and reviewer', async () => {
      prismaService.reviewImg.findMany.mockResolvedValue([reviewImgWithReviewMock]);
      kakaoLoginService.findUsers.mockResolvedValue([kakaoUserInfoDtoMock]);
      const result = await service.findReviewImgs(1, reviewMock.productId);
      expect(result).toEqual([reviewImgWithReviewAndReviewerMock]);
    });
  });

  describe('findMany', () => {
    it('should return review imgs data', async () => {
      const findReviewImgsDto: FindReviewImgsDto = {
        page: 1
      };
      const total = 1;
      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      service.findReviewImgs = jest.fn().mockResolvedValue([reviewImgWithReviewAndReviewerMock]);
      prismaService.reviewImg.count.mockResolvedValue(total);
      const result = await service.findMany(findReviewImgsDto, reviewMock.productId);
      expect(result).toEqual(reviewImgsDataMock);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const findReviewImgsDto: FindReviewImgsDto = {
        page: 1
      };
      prismaService.product.findUnique.mockResolvedValue(null);
      return expect(service.findMany(findReviewImgsDto, reviewMock.productId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
