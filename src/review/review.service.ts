import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { sanitizeReview, sanitizeReviews } from '@/utils/review';

import {
  CreateReview,
  OrderBy,
  ReviewsData,
  SortBy,
  SortingOpts,
  UpdateReview
} from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateReview) {
    const review = await this.prismaService.review.findUnique({
      where: {
        productId_userId: {
          userId: data.userId,
          productId: data.productId
        }
      }
    });

    if (review) {
      throw new ConflictException('User has already submitted a review for this product');
    }

    const createdReview = await this.prismaService.review.create({ data });
    return sanitizeReview(createdReview);
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

    const deletedReview = await this.prismaService.review.delete({
      where: {
        id
      }
    });
    return sanitizeReview(deletedReview);
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

    return sanitizeReview(review);
  }

  async findSortedAndPaginatedReviews({
    productId,
    sortBy,
    orderBy,
    page
  }: {
    productId: number;
    sortBy: SortBy;
    orderBy: OrderBy;
    page: number;
  }) {
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
    const reviews = await this.prismaService.review.findMany({
      where: {
        productId
      },
      take: REVIEW_PAGE_SIZE,
      skip: (page - 1) * REVIEW_PAGE_SIZE,
      orderBy: sortingOpts[sortBy][orderBy]
    });
    return sanitizeReviews(reviews);
  }

  async findMany({
    productId,
    sortBy = 'rating',
    orderBy = 'desc',
    page
  }: {
    productId: number;
    sortBy?: SortBy;
    orderBy?: OrderBy;
    page: number;
  }) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.findSortedAndPaginatedReviews({
      productId,
      sortBy,
      orderBy,
      page
    });
    const totalReviews = await this.prismaService.review.count({
      where: {
        productId
      }
    });
    const totalPages = Math.ceil(totalReviews / REVIEW_PAGE_SIZE);
    const reviewsData: ReviewsData = {
      reviews,
      meta: { page, pageSize: REVIEW_PAGE_SIZE, totalReviews, totalPages }
    };
    return reviewsData;
  }

  async update({
    userId,
    productId,
    id,
    data
  }: {
    userId: string;
    productId: number;
    id: number;
    data: UpdateReview;
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

    const updatedReview = await this.prismaService.review.update({
      where: {
        id
      },
      data
    });

    return sanitizeReview(updatedReview);
  }
}
