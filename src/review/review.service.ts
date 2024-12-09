import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateReview } from '@/types/review.type';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateReview) {
    return this.prismaService.review.create({ data });
  }
}
