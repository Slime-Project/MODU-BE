import { Injectable } from '@nestjs/common';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { calculateSkip, calculateTotalPages } from '@/utils/page';

import { ReviewsData } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
