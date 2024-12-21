import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Product, Review } from '@prisma/client';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/product/review/dto/create-review.dto';
import { ProductReviewService } from '@/product/review/product-review.service';
import { S3Service } from '@/s3/s3.service';
import { createProduct, createReview, deleteProduct } from '@/utils/integration-test';

describe('ProductReviewService (integration)', () => {
  let service: ProductReviewService;
  let prismaService: PrismaService;

  let product: Product;
  const userId = '4';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductReviewService, PrismaService, KakaoLoginService, S3Service, ConfigService]
    }).compile();

    service = module.get(ProductReviewService);
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
        product.id
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
        product.id
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
        product.id
      );
      expect(isSortedByNewest(result)).toEqual(true);
    });
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
});
