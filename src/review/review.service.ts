import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateReview, UpdateReview } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateReview) {
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

    return updatedReview;
  }
}
