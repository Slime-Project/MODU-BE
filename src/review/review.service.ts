import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { S3Service } from '@/s3/s3.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { updateAverageRating } from '@/utils/review';

import { UpdateReviewDto } from './dto/update-review.dto';

import { ReviewsData, ReviewWithImgs } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service
  ) {}

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
    userId: string
  ): Promise<ReviewWithImgs[]> {
    const reviews = await this.prismaService.review.findMany({
      where: {
        userId
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

  async findMany(findReviewsDto: FindReviewsDto, userId: string) {
    const reviews = await this.findSortedAndPaginatedReviews(findReviewsDto, userId);
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

  async count(userId: string) {
    const count = await this.prismaService.review.count({
      where: {
        userId
      }
    });
    return { count };
  }

  async update({
    userId,
    id,
    updateReviewDto
  }: {
    userId: string;
    id: number;
    updateReviewDto: UpdateReviewDto;
  }): Promise<ReviewWithImgs> {
    const review = await this.prismaService.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    let result;

    if (updateReviewDto.rating !== review.rating) {
      result = await this.prismaService.$transaction(async prisma => {
        const updatedReview = await prisma.review.update({
          where: {
            id
          },
          data: updateReviewDto,
          include: {
            imgs: {
              select: {
                url: true
              }
            }
          }
        });
        await updateAverageRating(prisma, review.productId);
        return updatedReview;
      });
    } else {
      result = await this.prismaService.review.update({
        where: {
          id
        },
        data: updateReviewDto,
        include: {
          imgs: {
            select: {
              url: true
            }
          }
        }
      });
    }

    return { ...result, imgs: result.imgs.map(({ url }) => url) };
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
