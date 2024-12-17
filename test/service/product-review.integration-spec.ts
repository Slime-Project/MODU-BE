import { Test } from '@nestjs/testing';
import { Product, Review } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/product/review/dto/create-review.dto';
import { ProductReviewService } from '@/product/review/product-review.service';
import { createProduct, createReview, deleteProduct } from '@/utils/integration-test';

describe('ProductReviewService (integration)', () => {
  let service: ProductReviewService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductReviewService, PrismaService]
    }).compile();

    service = module.get(ProductReviewService);
    prismaService = module.get(PrismaService);
  });

  describe('findSortedAndPaginatedReviews', () => {
    const userId1 = '5678901234';
    const userId2 = '6789012345';
    const userId3 = '7890123456';
    let product: Product;

    beforeAll(async () => {
      await prismaService.user.createMany({
        data: [{ id: userId1 }, { id: userId2 }, { id: userId3 }]
      });
      product = await createProduct(prismaService);
      await Promise.all(
        [userId1, userId2, userId3].map((userId, i) =>
          createReview(prismaService, {
            userId,
            productId: product.id,
            rating: i + (1 % 5),
            createdAt: new Date(new Date().getTime() + i * 1000)
          })
        )
      );
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

    afterAll(async () => {
      return Promise.allSettled([
        prismaService.user.deleteMany({
          where: {
            id: {
              in: [userId1, userId2, userId3]
            }
          }
        }),
        deleteProduct(prismaService, product.id)
      ]);
    });
  });

  describe('should update product averageRating', () => {
    const userId = '4';
    let product: Product;

    beforeAll(async () => {
      const result = await Promise.all([
        createProduct(prismaService),
        prismaService.user.create({
          data: { id: userId }
        })
      ]);
      product = result[0] as Product;
    });

    it('create', async () => {
      const createReviewDto: CreateReviewDto = {
        text: 'good',
        rating: 1
      };
      const { id } = await service.create(createReviewDto, userId, product.id);
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
  });
});
