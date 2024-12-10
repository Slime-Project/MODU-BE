import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';
import { PrismaService } from '@/prisma/prisma.service';
import { PutReviewReqDto } from '@/review/dto/put-review-req.dto';
import { ReviewModule } from '@/review/review.module';
import {
  createProduct,
  createTestingApp,
  createUser,
  deleteProduct,
  deleteUser
} from '@/utils/integration-test';
import { sanitizeReviews } from '@/utils/review';

import { ReviewsData, SanitizedReview } from '@/types/review.type';

describe('ReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  const createReview = async (userId: string, productId: number, rating?: number) => {
    return prismaService.review.create({
      data: { userId, productId, text: '', rating: rating || 1 }
    });
  };

  describe('/api/products/:productId/reviews (POST)', () => {
    it('201', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);

      const review: SanitizedReview = {
        id: expect.any(Number),
        text: 'Great product!',
        rating: 5,
        createdAt: expect.any(String)
      };
      const res = await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [refreshTokenCookie])
        .send({ text: review.text, rating: review.rating })
        .expect(201);
      expect(res.body).toEqual(review);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });
  });

  describe('/api/products/:productId/reviews/:id (DELETE)', () => {
    it('201', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      const review = await createReview(userId, product.id);

      await request(app.getHttpServer())
        .delete(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(204);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/products/0/reviews/0').expect(401);
    });

    it('403', async () => {
      const userId = '3456789012';
      const anotherUserId = '4567890123';
      const { refreshTokenCookie } = await createUser(app, userId);
      await createUser(app, anotherUserId);
      const product = await createProduct(prismaService);
      const review = await createReview(anotherUserId, product.id);

      await request(app.getHttpServer())
        .delete(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(403);

      await deleteUser(prismaService, userId);
      await deleteUser(prismaService, anotherUserId);
      await deleteProduct(prismaService, product.id);
    });

    it('404', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);

      await request(app.getHttpServer())
        .delete('/api/products/0/reviews/0')
        .set('Cookie', [refreshTokenCookie])
        .expect(404);

      await deleteUser(prismaService, userId);
    });
  });

  describe('/api/products/:productId/reviews/:id (GET)', () => {
    it('200', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      const review = await createReview(userId, product.id);

      const expectedRes: SanitizedReview = {
        id: expect.any(Number),
        text: review.text,
        rating: review.rating,
        createdAt: expect.any(String)
      };

      const res = await request(app.getHttpServer())
        .get(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(200);
      expect(res.body).toEqual(expectedRes);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/products/0/reviews/0').expect(401);
    });

    it('403', async () => {
      const userId = '3456789012';
      const anotherUserId = '4567890123';
      const { refreshTokenCookie } = await createUser(app, userId);
      await createUser(app, anotherUserId);
      const product = await createProduct(prismaService);
      const review = await createReview(anotherUserId, product.id);

      await request(app.getHttpServer())
        .get(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(403);

      await deleteUser(prismaService, userId);
      await deleteUser(prismaService, anotherUserId);
      await deleteProduct(prismaService, product.id);
    });

    it('404', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);

      await request(app.getHttpServer())
        .get('/api/products/0/reviews/0')
        .set('Cookie', [refreshTokenCookie])
        .expect(404);

      await deleteUser(prismaService, userId);
    });
  });

  describe('/api/products/:productId/reviews (GET)', () => {
    it('200', async () => {
      const userId1 = '3456789012';
      const userId2 = '4567890123';
      await prismaService.user.createMany({
        data: [
          { id: userId1, role: UserRole.USER },
          { id: userId2, role: UserRole.USER }
        ]
      });
      const product = await createProduct(prismaService);
      const reviews = await Promise.all([
        createReview(userId1, product.id, 1),
        createReview(userId2, product.id, 3)
      ]);
      const page = 1;
      const reviewsData: ReviewsData = {
        reviews: sanitizeReviews(reviews).sort((a, b) => b.rating - a.rating),
        meta: { page, pageSize: REVIEW_PAGE_SIZE, totalReviews: reviews.length, totalPages: 1 }
      };
      const body = {
        reviews: reviewsData.reviews.map(review => ({
          ...review,
          createdAt: review.createdAt.toISOString()
        })),
        meta: reviewsData.meta
      };

      const res = await request(app.getHttpServer())
        .get(`/api/products/${product.id}/reviews?page=${page}`)
        .expect(200);
      expect(res.body).toEqual(body);

      await Promise.allSettled([
        deleteUser(prismaService, userId1),
        deleteUser(prismaService, userId2),
        deleteProduct(prismaService, product.id)
      ]);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews?page=1').expect(404);
    });
  });

  describe('/api/products/:productId/reviews/:id (PATCH)', () => {
    it('200', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      const review = await createReview(userId, product.id);
      const reqBody: PutReviewReqDto = {
        text: 'new-text',
        rating: 5
      };
      const expectedRes: SanitizedReview = {
        id: expect.any(Number),
        createdAt: expect.any(String),
        text: reqBody.text,
        rating: reqBody.rating
      };

      const res = await request(app.getHttpServer())
        .patch(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .send(reqBody)
        .expect(200);
      expect(res.body).toEqual(expectedRes);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).patch('/api/products/0/reviews/0').expect(401);
    });

    it('403', async () => {
      const userId = '3456789012';
      const anotherUserId = '4567890123';
      const { refreshTokenCookie } = await createUser(app, userId);
      await createUser(app, anotherUserId);
      const product = await createProduct(prismaService);
      const review = await createReview(anotherUserId, product.id);
      const reqBody: PutReviewReqDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch(`/api/products/${review.productId}/reviews/${review.id}`)
        .send(reqBody)
        .set('Cookie', [refreshTokenCookie])
        .expect(403);

      await deleteUser(prismaService, userId);
      await deleteUser(prismaService, anotherUserId);
      await deleteProduct(prismaService, product.id);
    });

    it('404', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const reqBody: PutReviewReqDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch('/api/products/0/reviews/0')
        .send(reqBody)
        .set('Cookie', [refreshTokenCookie])
        .expect(404);

      await deleteUser(prismaService, userId);
    });
  });
});
