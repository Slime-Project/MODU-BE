import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { updateAverageRating } from '@/utils/review';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';

import { CreateReview, ReviewsData } from '@/types/review.type';

@Injectable()
export class ProductReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId: string, productId: number) {
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
      await updateAverageRating(prisma, productId);
      return createdReview;
    });
    return result;
  }

  async findSortedAndPaginatedReviews(findReviewsDto: FindReviewsDto, productId: number) {
    return this.prismaService.review.findMany({
      where: {
        productId
      },
      take: REVIEWS_PAGE_SIZE,
      skip: calculateSkip(findReviewsDto.page, REVIEWS_PAGE_SIZE),
      orderBy:
        REIVEW_ORDERBY_OPTS[findReviewsDto.sortBy || 'rating'][findReviewsDto.orderBy || 'desc']
    });
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
    const total = await this.prismaService.review.count({
      where: {
        productId
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
