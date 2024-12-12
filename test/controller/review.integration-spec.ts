import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewResDto } from '@/review/dto/find-review-res.dto';
import { FindReviewsResDto } from '@/review/dto/find-reviews-res.dto';
import { UpdateReviewResDto } from '@/review/dto/update-review-res.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { ReviewModule } from '@/review/review.module';
import {
  createProduct,
  createTestingApp,
  createUser,
  deleteProduct,
  deleteUser,
  validateResDto
} from '@/utils/integration-test';

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
      const req: CreateReviewDto = {
        text: 'Great product!',
        rating: 5
      };
      const { body } = await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [refreshTokenCookie])
        .send(req)
        .expect(201);
      validateResDto(CreateReviewResDto, body);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });

    it('409', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      await createReview(userId, product.id);

      await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [refreshTokenCookie])
        .send({ text: 'Great product!', rating: 5 })
        .expect(409);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });
  });

  describe('/api/products/:productId/reviews/:id (DELETE)', () => {
    it('204', async () => {
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

      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(200);
      validateResDto(FindReviewResDto, body);

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
        data: [{ id: userId1 }, { id: userId2 }]
      });
      const product = await createProduct(prismaService);
      await Promise.all([
        createReview(userId1, product.id, 1),
        createReview(userId2, product.id, 3)
      ]);
      const page = 1;
      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${product.id}/reviews?page=${page}`)
        .expect(200);
      validateResDto(FindReviewsResDto, body);

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
      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };
      const { body } = await request(app.getHttpServer())
        .patch(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .send(patchReviewDto)
        .expect(200);
      validateResDto(UpdateReviewResDto, body);

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
      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch(`/api/products/${review.productId}/reviews/${review.id}`)
        .send(patchReviewDto)
        .set('Cookie', [refreshTokenCookie])
        .expect(403);

      await deleteUser(prismaService, userId);
      await deleteUser(prismaService, anotherUserId);
      await deleteProduct(prismaService, product.id);
    });

    it('404', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch('/api/products/0/reviews/0')
        .send(patchReviewDto)
        .set('Cookie', [refreshTokenCookie])
        .expect(404);

      await deleteUser(prismaService, userId);
    });
  });
});
