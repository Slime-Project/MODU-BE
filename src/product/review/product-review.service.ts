import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { S3Service } from '@/s3/s3.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { updateAverageRating } from '@/utils/review';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';

import {
  CreateReview,
  ReviewsWithReviewerData,
  ReviewWithImgs,
  ReviewWithReviewer
} from '@/types/review.type';

@Injectable()
export class ProductReviewService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly kakaoLoginService: KakaoLoginService
  ) {}

  async createImgs(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    imgs: Express.Multer.File[],
    reviewId: number
  ) {
    const imgsData = await Promise.all(
      imgs.map(async (img, i) => {
        const ext = img.originalname.split('.').pop();
        const filePath = `review/${reviewId}/${i + 1}.${ext}`;
        const url = await this.s3Service.uploadImgToS3(filePath, img, ext);
        return { filePath, url };
      })
    );

    try {
      await prisma.reviewImg.createMany({
        data: imgsData.map((imgData, i) => ({ reviewId, ...imgData, order: i + 1 }))
      });
      return imgsData.map(({ url }) => url);
    } catch (error) {
      await Promise.all(imgsData.map(({ filePath }) => this.s3Service.deleteImgFromS3(filePath)));
      throw error;
    }
  }

  async create({
    createReviewDto,
    userId,
    productId,
    imgs
  }: {
    createReviewDto: CreateReviewDto;
    userId: string;
    productId: number;
    imgs: Express.Multer.File[];
  }): Promise<ReviewWithImgs> {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = await this.prismaService.review.findUnique({
      where: {
        productId_userId: {
          userId,
          productId
        }
      }
    });

    if (review) {
      throw new ConflictException('User has already submitted a review for this product');
    }

    const data: CreateReview = { ...createReviewDto, userId, productId };
    const result = await this.prismaService.$transaction(async prisma => {
      const createdReview = await prisma.review.create({ data });
      const [imgsUrl] = await Promise.all([
        this.createImgs(prisma, imgs, createdReview.id),
        updateAverageRating(prisma, productId)
      ]);
      return { ...createdReview, imgs: imgsUrl };
    });
    return result;
  }

  async findSortedAndPaginatedReviews(
    findReviewsDto: FindReviewsDto,
    productId: number
  ): Promise<ReviewWithImgs[]> {
    const reviews = await this.prismaService.review.findMany({
      where: {
        productId
      },
      take: REVIEWS_PAGE_SIZE,
      skip: calculateSkip(findReviewsDto.page, REVIEWS_PAGE_SIZE),
      orderBy:
        REIVEW_ORDERBY_OPTS[findReviewsDto.sortBy || 'rating'][findReviewsDto.orderBy || 'desc'],
      include: {
        imgs: {
          select: {
            url: true
          }
        }
      }
    });
    return reviews.map(review => ({ ...review, imgs: review.imgs.map(({ url }) => url) }));
  }

  async findMany(findReviewsDto: FindReviewsDto, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.findSortedAndPaginatedReviews(findReviewsDto, productId);
    const reviewsWithreviewer: ReviewWithReviewer[] = reviews.map(review => ({
      ...review,
      reviewer: null
    }));
    const ids = reviews.filter(({ userId }) => userId !== null).map(({ userId }) => Number(userId));

    if (ids.length) {
      const users = await this.kakaoLoginService.findUsers(ids);
      users.forEach(user => {
        reviewsWithreviewer.find(({ userId }) => userId === user.id).reviewer = user;
      });
    }

    const total = await this.prismaService.review.count({
      where: {
        productId
      }
    });
    const totalPages = calculateTotalPages(total, REVIEWS_PAGE_SIZE);
    const reviewsData: ReviewsWithReviewerData = {
      reviews: reviewsWithreviewer,
      pageSize: REVIEWS_PAGE_SIZE,
      total,
      totalPages
    };
    return reviewsData;
  }

  async count(productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const count = await this.prismaService.review.count({
      where: {
        productId
      }
    });
    return { count };
  }
}
