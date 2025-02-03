import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Product, Review } from '@prisma/client';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
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
      providers: [ReviewService, PrismaService, S3Service, ConfigService, KakaoLoginService]
    }).compile();

    service = module.get(ReviewService);
    prismaService = module.get(PrismaService);

    const [createdProduct] = await Promise.all([
      createProduct(prismaService),
      prismaService.user.create({
        data: { id: userId }
      })
    ]);
    product = createdProduct;
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

  describe('create', () => {
    it('should update product averageRating', async () => {
      const createReviewDto: CreateReviewDto = {
        text: 'good',
        rating: 1
      };
      const { id } = await service.create({
        createReviewDto,
        userId,
        productId: product.id,
        imgs: []
      });
      const updatedProduct = await prismaService.product.findUnique({
        where: { id: product.id }
      });
      expect(updatedProduct.averageRating).toEqual(createReviewDto.rating);

      await prismaService.review.delete({
        where: {
          id
        }
      });
    });
  });

  describe('findSortedAndPaginatedReviews', () => {
    const anotherUserId = '5';
    const anotherUserId2 = '6';

    beforeAll(async () => {
      await prismaService.user.createMany({
        data: [{ id: anotherUserId }, { id: anotherUserId2 }]
      });
      product = await createProduct(prismaService);
      await Promise.all(
        [userId, anotherUserId, anotherUserId2].map((id, i) =>
          createReview(prismaService, {
            userId: id,
            productId: product.id,
            rating: i + (1 % 5),
            createdAt: new Date(new Date().getTime() + i * 1000)
          })
        )
      );
    });

    afterAll(async () => {
      return Promise.allSettled([
        prismaService.user.deleteMany({
          where: {
            id: {
              in: [anotherUserId, anotherUserId2]
            }
          }
        }),
        prismaService.review.deleteMany({
          where: {
            productId: product.id
          }
        })
      ]);
    });

    it('should return reviews sorted by rating desc', async () => {
      const page = 1;
      const isSortedByRating = (reviews: Review[]) => {
        for (let i = 1; i < reviews.length; i += 1) {
          if (reviews[i - 1].rating < reviews[i].rating) {
            return false;
          }
        }

        return true;
      };
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'rating',
          orderBy: 'desc',
          page
        },
        { productId: product.id }
      );
      expect(isSortedByRating(result)).toEqual(true);
    });

    it('should return reviews sorted by rating asc', async () => {
      const page = 1;
      const isSortedByRatingAsc = (reviews: Review[]) => {
        for (let i = 1; i < reviews.length; i += 1) {
          if (reviews[i - 1].rating > reviews[i].rating) {
            return false;
          }
        }

        return true;
      };
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'rating',
          orderBy: 'asc',
          page
        },
        { productId: product.id }
      );
      expect(isSortedByRatingAsc(result)).toEqual(true);
    });

    it('should return reviews sorted by newest', async () => {
      const page = 1;
      const isSortedByNewest = (reviews: Review[]) => {
        for (let i = 1; i < reviews.length; i += 1) {
          if (reviews[i - 1].createdAt < reviews[i].createdAt) {
            return false;
          }
        }

        return true;
      };
      const result = await service.findSortedAndPaginatedReviews(
        {
          sortBy: 'createdAt',
          orderBy: 'desc',
          page
        },
        { productId: product.id }
      );
      expect(isSortedByNewest(result)).toEqual(true);
    });
  });

  describe('update', () => {
    it('should update product averageRating', async () => {
      const review = await createReview(prismaService, {
        userId,
        productId: product.id,
        rating: 1
      });

      const updateReviewDto: UpdateReviewDto = {
        rating: 2
      };
      await service.update({ userId, reviewId: review.id, updateReviewDto });
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
