import { Test } from '@nestjs/testing';
import { Product, Review } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { ReviewService } from '@/review/review.service';
import { createProduct, createReview, deleteProduct } from '@/utils/integration-test';

describe('ReviewService (integration)', () => {
  let reviewService: ReviewService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ReviewService, PrismaService]
    }).compile();

    reviewService = module.get(ReviewService);
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
      const result = await reviewService.findSortedAndPaginatedReviews(
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
      const result = await reviewService.findSortedAndPaginatedReviews(
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
      const result = await reviewService.findSortedAndPaginatedReviews(
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
});
