import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { REVIEWS_PAGE_SIZE, REIVEW_ORDERBY_OPTS } from '@/constants/review';
import { PrismaService } from '@/prisma/prisma.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

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
    return this.prismaService.review.create({ data });
  }

  async remove(userId: string, productId: number, id: number) {
    const review = await this.prismaService.review.findUnique({
      where: {
        id_productId: {
          id,
          productId
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    await this.prismaService.review.delete({
      where: {
        id
      }
    });
  }

  async findOne(userId: string, productId: number, id: number) {
    const review = await this.prismaService.review.findUnique({
      where: {
        id_productId: {
          id,
          productId
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    return review;
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

  async update({
    userId,
    productId,
    id,
    updateReviewDto
  }: {
    userId: string;
    productId: number;
    id: number;
    updateReviewDto: UpdateReviewDto;
  }) {
    const review = await this.prismaService.review.findUnique({
      where: {
        id_productId: {
          id,
          productId
        }
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    return this.prismaService.review.update({
      where: {
        id
      },
      data: updateReviewDto
    });
  }
}
