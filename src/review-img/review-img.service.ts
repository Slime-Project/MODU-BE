import { Injectable, NotFoundException } from '@nestjs/common';

import { REVIEW_ORDER_BY_DEFAULT } from '@/constants/review';
import { REVIEW_IMGS_ORDER_BY, REVIEW_IMGS_PAGE_SIZE } from '@/constants/review-img';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewImgsDto } from '@/review-img/dto/find-review-imgs.dto';
import { calculateSkip, calculateTotalPages } from '@/utils/page';

import { ReviewImgWithReviewAndReviewer, ReviewImgsData } from '@/types/review-img.type';

@Injectable()
export class ReviewImgService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly kakaoLoginService: KakaoLoginService
  ) {}

  async findReviewImgs(page: number, productId: number): Promise<ReviewImgWithReviewAndReviewer[]> {
    const reviewImgs = await this.prismaService.reviewImg.findMany({
      where: {
        review: {
          productId
        }
      },
      take: REVIEW_IMGS_PAGE_SIZE,
      skip: calculateSkip(page, REVIEW_IMGS_PAGE_SIZE),
      orderBy: [
        ...REVIEW_ORDER_BY_DEFAULT.map(opt => ({
          review: opt
        })),
        REVIEW_IMGS_ORDER_BY
      ],
      include: {
        review: true
      }
    });
    const reviewImgsWithReviewAndReviewer: ReviewImgWithReviewAndReviewer[] = reviewImgs.map(
      ({ review, ...reviewImg }) => ({
        ...reviewImg,
        review: {
          ...review,
          reviewer: null
        }
      })
    );
    const ids = reviewImgsWithReviewAndReviewer
      .filter(({ review }) => review.userId !== null)
      .map(({ review }) => Number(review.userId));

    if (ids.length) {
      const users = await this.kakaoLoginService.findUsers(ids);
      users.forEach(({ id, ...profile }) => {
        reviewImgsWithReviewAndReviewer.find(({ review }) => review.userId === id).review.reviewer =
          profile;
      });
    }

    return reviewImgsWithReviewAndReviewer;
  }

  async findMany(findReviewImgsDto: FindReviewImgsDto, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviewImgs = await this.findReviewImgs(findReviewImgsDto.page, productId);
    const total = await this.prismaService.reviewImg.count({
      where: {
        review: { productId }
      }
    });
    const totalPages = calculateTotalPages(total, REVIEW_IMGS_PAGE_SIZE);
    const reviewImgsData: ReviewImgsData = {
      reviewImgs,
      pageSize: REVIEW_IMGS_PAGE_SIZE,
      total,
      totalPages
    };
    return reviewImgsData;
  }
}
