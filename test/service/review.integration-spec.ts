import { Test, TestingModule } from '@nestjs/testing';
import { Product, Review } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { ReviewService } from '@/review/review.service';
import { createProduct, createReview, deleteProduct } from '@/utils/integration-test';
import { sanitizeReviews } from '@/utils/review';

import { SanitizedReview } from '@/types/review.type';

describe('ReviewService (integration)', () => {
  let reviewService: ReviewService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
    let reviews: Review[];

    beforeAll(async () => {
      await prismaService.user.createMany({
        data: [{ id: userId1 }, { id: userId2 }, { id: userId3 }]
      });
      product = await createProduct(prismaService);
      reviews = await Promise.all(
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
      const sanitizedReviews: SanitizedReview[] = sanitizeReviews(reviews).sort(
        (a, b) => b.rating - a.rating
      );
      const result = await reviewService.findSortedAndPaginatedReviews({
        productId: product.id,
        sortBy: 'rating',
        orderBy: 'desc',
        page
      });
      expect(result).toEqual(sanitizedReviews);
    });

    it('should return reviews sorted by rating asc', async () => {
      const page = 1;
      const sanitizedReviews: SanitizedReview[] = sanitizeReviews(reviews).sort(
        (a, b) => a.rating - b.rating
      );
      const result = await reviewService.findSortedAndPaginatedReviews({
        productId: product.id,
        sortBy: 'rating',
        orderBy: 'asc',
        page
      });
      expect(result).toEqual(sanitizedReviews);
    });

    it('should return reviews sorted by newest', async () => {
      const page = 1;
      const sanitizedReviews: SanitizedReview[] = sanitizeReviews(reviews).sort(
        (a, b) => b.createdAt.getSeconds() - a.createdAt.getSeconds()
      );
      const result = await reviewService.findSortedAndPaginatedReviews({
        productId: product.id,
        sortBy: 'createdAt',
        orderBy: 'desc',
        page
      });
      expect(result).toEqual(sanitizedReviews);
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
