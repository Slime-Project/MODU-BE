import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaClient, ReviewImg } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS, REVIEW_IMGS_ORDER_BY } from '@/constants/review';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { S3Service } from '@/s3/s3.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { updateAverageRating } from '@/utils/review';

import { FindReviewsDto } from './dto/find-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import {
  CreateReview,
  ReviewIncludeImgs,
  ReviewsData,
  ReviewsWithReviewerData,
  ReviewWithImgs,
  ReviewWithReviewer
} from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly kakaoLoginService: KakaoLoginService
  ) {}

  async createImgs({
    prisma,
    imgs,
    reviewId,
    startOrder = 1
  }: {
    prisma: Omit<PrismaClient, ITXClientDenyList>;
    imgs: Express.Multer.File[];
    reviewId: number;
    startOrder?: number;
  }) {
    const imgsData = await Promise.all(
      imgs.map(async (img, i) => {
        const ext = img.mimetype.match(/^image\/(.+)$/)[1];
        const filePath = `review/${reviewId}/${i + startOrder}.${ext}`;
        const url = await this.s3Service.uploadImgToS3(filePath, img, ext);
        return { filePath, url };
      })
    );

    try {
      await prisma.reviewImg.createMany({
        data: imgsData.map((imgData, i) => ({ reviewId, ...imgData, order: i + startOrder }))
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
    imgs?: Express.Multer.File[];
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
      const createdImgsUrl: string[] = [];

      if (imgs) {
        const [imgsUrl] = await Promise.all([
          this.createImgs({ prisma, imgs, reviewId: createdReview.id }),
          updateAverageRating(prisma, productId)
        ]);
        createdImgsUrl.push(...imgsUrl);
      } else {
        await updateAverageRating(prisma, productId);
      }

      return { ...createdReview, imgs: createdImgsUrl };
    });
    return result;
  }

  async findOne(id: number): Promise<ReviewWithImgs> {
    const review = await this.prismaService.review.findUnique({
      where: { id },
      include: {
        imgs: {
          select: {
            url: true
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return { ...review, imgs: review.imgs.map(({ url }) => url) };
  }

  async findSortedAndPaginatedReviews(
    findReviewsDto: FindReviewsDto,
    where: { userId?: string; productId?: number }
  ): Promise<ReviewWithImgs[]> {
    const reviews = await this.prismaService.review.findMany({
      where,
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

  async findUserReviews(findReviewsDto: FindReviewsDto, userId: string) {
    const reviews = await this.findSortedAndPaginatedReviews(findReviewsDto, { userId });
    const total = await this.prismaService.review.count({
      where: {
        userId
      }
    });
    const totalPages = calculateTotalPages(total, REVIEWS_PAGE_SIZE);
    const reviewsData: ReviewsData = {
      reviews,
      pageSize: REVIEWS_PAGE_SIZE,
      total,
      totalPages
    };
    return reviewsData;
  }

  async findProductReviews(findReviewsDto: FindReviewsDto, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.findSortedAndPaginatedReviews(findReviewsDto, { productId });
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

  async count(userId: string) {
    const count = await this.prismaService.review.count({
      where: {
        userId
      }
    });
    return { count };
  }

  static async updateImgsOrder({
    prisma,
    reviewImgs,
    reorderedImgsUrl
  }: {
    prisma: Omit<PrismaClient, ITXClientDenyList>;
    reviewImgs: ReviewImg[];
    reorderedImgsUrl: string[];
  }) {
    const orderChangedImgs: { id: number; order: number }[] = [];
    reviewImgs.forEach(({ id, url, order }) => {
      const i = reorderedImgsUrl.findIndex(reorderedImgUrl => reorderedImgUrl === url);
      const updatedOrder = i + 1;

      if (i !== -1 && order !== updatedOrder) {
        orderChangedImgs.push({ id, order: updatedOrder });
      }
    });
    await Promise.all(
      orderChangedImgs.map(({ id, order }) =>
        prisma.reviewImg.update({
          where: { id },
          data: { order }
        })
      )
    );
  }

  static async deleteReviewImgs(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    reviewImgsId: number[]
  ) {
    await prisma.reviewImg.deleteMany({
      where: {
        id: {
          in: reviewImgsId
        }
      }
    });
  }

  static async deleteAllReviewImgs(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    reviewId: number
  ) {
    await prisma.reviewImg.deleteMany({
      where: {
        reviewId
      }
    });
  }

  async updateImgs({
    prisma,
    review,
    imgs,
    newImgs
  }: {
    prisma: Omit<PrismaClient, ITXClientDenyList>;
    review: ReviewIncludeImgs;
    imgs?: string[];
    newImgs?: Express.Multer.File[];
  }) {
    const updatedImgsUrl: string[] = [];
    let imgDeletionPromise: Promise<void | void[]>;

    if (imgs === undefined) {
      imgDeletionPromise = ReviewService.deleteAllReviewImgs(prisma, review.id);
    } else {
      updatedImgsUrl.push(...imgs);
      imgDeletionPromise = Promise.all([
        ReviewService.deleteReviewImgs(
          prisma,
          review.imgs.filter(({ url }) => !imgs.includes(url)).map(({ id }) => id)
        ),
        ReviewService.updateImgsOrder({ prisma, reviewImgs: review.imgs, reorderedImgsUrl: imgs })
      ]);
    }

    if (newImgs) {
      const newImgsUrl = await this.createImgs({
        prisma,
        imgs: newImgs,
        reviewId: review.id,
        startOrder: (imgs?.length || 0) + 1
      });
      updatedImgsUrl.push(...newImgsUrl);
    }

    await imgDeletionPromise;
    return updatedImgsUrl;
  }

  async update({
    userId,
    reviewId,
    updateReviewDto,
    newImgs
  }: {
    userId: string;
    reviewId: number;
    updateReviewDto: UpdateReviewDto;
    newImgs?: Express.Multer.File[];
  }): Promise<ReviewWithImgs> {
    const review = await this.prismaService.review.findUnique({
      where: { id: reviewId },
      include: {
        imgs: {
          orderBy: REVIEW_IMGS_ORDER_BY
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    const result = await this.prismaService.$transaction(async prisma => {
      const reviewUpdatePromise = prisma.review.update({
        where: {
          id: reviewId
        },
        data: { rating: updateReviewDto.rating, text: updateReviewDto.text }
      });
      const imgsUpdatePromise = this.updateImgs({
        review,
        imgs: updateReviewDto.imgs,
        newImgs,
        prisma
      });
      const updatedReview = await reviewUpdatePromise;

      if (updateReviewDto.rating !== review.rating) {
        // Must run after the review update is completed
        await updateAverageRating(prisma, review.productId);
      }

      const updatedImgsUrl = await imgsUpdatePromise;
      return { ...updatedReview, imgs: updatedImgsUrl };
    });

    await Promise.all(
      review.imgs
        .filter(({ url }) => !result.imgs.includes(url))
        .map(({ filePath }) => this.s3Service.deleteImgFromS3(filePath))
    );
    return result;
  }

  async remove(userId: string, id: number) {
    const review = await this.prismaService.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    const imgs = await this.prismaService.reviewImg.findMany({
      where: {
        reviewId: id
      },
      select: {
        filePath: true
      }
    });
    await this.prismaService.$transaction(async prisma => {
      await this.prismaService.review.delete({
        where: {
          id
        }
      });
      await updateAverageRating(prisma, review.productId);
    });
    await Promise.all(imgs.map(({ filePath }) => this.s3Service.deleteImgFromS3(filePath)));
  }
}
