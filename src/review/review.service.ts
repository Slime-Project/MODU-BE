import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { GetReviewsDto } from '@/review/dto/get-reviews.dto';
import { PatchReviewDto } from '@/review/dto/patch-review.dto';

import { CreateReview, ReviewsData, SortingOpts } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId: string, productId: number) {
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

  async delete(userId: string, productId: number, id: number) {
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

    return this.prismaService.review.delete({
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

  async findSortedAndPaginatedReviews(getReviewsDto: GetReviewsDto, productId: number) {
    const sortingOpts: SortingOpts = {
      createdAt: {
        desc: [{ createdAt: 'desc' }, { id: 'desc' }],
        asc: [{ createdAt: 'asc' }, { id: 'desc' }]
      },
      rating: {
        desc: [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        asc: [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }]
      }
    };
    return this.prismaService.review.findMany({
      where: {
        productId
      },
      take: REVIEW_PAGE_SIZE,
      skip: (getReviewsDto.page - 1) * REVIEW_PAGE_SIZE,
      orderBy: sortingOpts[getReviewsDto.sortBy || 'rating'][getReviewsDto.orderBy || 'desc']
    });
  }

  async findMany(getReviewsDto: GetReviewsDto, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.findSortedAndPaginatedReviews(getReviewsDto, productId);
    const totalReviews = await this.prismaService.review.count({
      where: {
        productId
      }
    });
    const totalPages = Math.ceil(totalReviews / REVIEW_PAGE_SIZE);
    const reviewsData: ReviewsData = {
      reviews,
      meta: { page: getReviewsDto.page, pageSize: REVIEW_PAGE_SIZE, totalReviews, totalPages }
    };
    return reviewsData;
  }

  async update({
    userId,
    productId,
    id,
    patchReviewDto
  }: {
    userId: string;
    productId: number;
    id: number;
    patchReviewDto: PatchReviewDto;
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
      data: patchReviewDto
    });
  }
}
