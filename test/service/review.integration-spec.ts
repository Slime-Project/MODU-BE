import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { ReviewService } from '@/review/review.service';
import { S3Service } from '@/s3/s3.service';
import { createProduct, createReview, deleteProduct } from '@/utils/integration-test';

describe('ReviewService (integration)', () => {
  let service: ReviewService;
  let prismaService: PrismaService;

  const userId = '8';
  let product: Product;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ReviewService, PrismaService, S3Service, ConfigService]
    }).compile();

    service = module.get(ReviewService);
    prismaService = module.get(PrismaService);

    const result = await Promise.all([
      createProduct(prismaService),
      prismaService.user.create({
        data: { id: userId }
      })
    ]);
    product = result[0] as Product;
  });

  afterAll(async () => {
    await Promise.all([
      prismaService.user.delete({
        where: {
          id: userId
        }
      }),
      deleteProduct(prismaService, product.id)
    ]);
  });

  describe('should update product averageRating', () => {
    it('update', async () => {
      const review = await createReview(prismaService, {
        userId,
        productId: product.id,
        rating: 1
      });

      const updateReviewDto: UpdateReviewDto = {
        rating: 2
      };
      await service.update({ userId, id: review.id, updateReviewDto });
      const updatedProduct = await prismaService.product.findUnique({
        where: { id: product.id }
      });
      expect(updatedProduct.averageRating).toEqual(updateReviewDto.rating);

      await prismaService.review.delete({
        where: {
          id: review.id
        }
      });
    });

    it('remove', async () => {
      const review = await createReview(prismaService, {
        userId,
        productId: product.id,
        rating: 1
      });

      await service.remove(userId, review.id);
      const updatedProduct = await prismaService.product.findUnique({
        where: { id: product.id }
      });
      expect(updatedProduct.averageRating).toEqual(0);
    });
  });
});
