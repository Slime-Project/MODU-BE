import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Review } from '@prisma/client';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { updateAverageRating } from '@/utils/review';

import { UpdateReviewDto } from './dto/update-review.dto';

import { ReviewsData } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(userId: string, id: number) {
    const review = await this.prismaService.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to get this review');
    }

    return review;
  }

  async findSortedAndPaginatedReviews(findReviewsDto: FindReviewsDto, userId: string) {
    return this.prismaService.review.findMany({
      where: {
        userId
      },
      take: REVIEWS_PAGE_SIZE,
      skip: calculateSkip(findReviewsDto.page, REVIEWS_PAGE_SIZE),
      orderBy:
        REIVEW_ORDERBY_OPTS[findReviewsDto.sortBy || 'rating'][findReviewsDto.orderBy || 'desc']
    });
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
  }) {
    const review = await this.prismaService.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    let result: Review;

    if (updateReviewDto.rating !== review.rating) {
      result = await this.prismaService.$transaction(async prisma => {
        const updatedReview = await prisma.review.update({
          where: {
            id
          },
          data: updateReviewDto
        });
        await updateAverageRating(prisma, review.productId);
        return updatedReview;
      });
    } else {
      result = await this.prismaService.review.update({
        where: {
          id
        },
        data: updateReviewDto
      });
    }

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

    await this.prismaService.$transaction(async prisma => {
      await this.prismaService.review.delete({
        where: {
          id
        }
      });
      await updateAverageRating(prisma, review.productId);
    });
  }
}
