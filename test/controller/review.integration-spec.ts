import { INestApplication } from '@nestjs/common';
import { Product } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewCountDto } from '@/product/review/dto/review-count.dto';
import { ReviewsDto } from '@/product/review/dto/reviews.dto';
import { ReviewDto } from '@/review/dto/review.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { ReviewModule } from '@/review/review.module';
import {
  createProduct,
  createReview,
  createTestingApp,
  createUser,
  deleteProduct,
  deleteUser,
  validateDto
} from '@/utils/integration-test';

describe('ProductReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const userId = '2';
  const anotherUserId = '3';
  let accessTokenCookie: string;
  let anotherAccessTokenCookie: string;
  let product: Product;

  beforeAll(async () => {
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);

    const user = await createUser(app, userId);
    const anotherUser = await createUser(app, anotherUserId);
    product = await createProduct(prismaService);
    accessTokenCookie = user.accessTokenCookie;
    anotherAccessTokenCookie = anotherUser.accessTokenCookie;
  });

  afterAll(async () => {
    await deleteUser(prismaService, userId);
    await deleteUser(prismaService, anotherUserId);
    await deleteProduct(prismaService, product.id);
  });

  describe('/api/reviews/:id (GET)', () => {
    it('200', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      const { body } = await request(app.getHttpServer())
        .get(`/api/reviews/${id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(200);
      validateDto(ReviewDto, body);

      await prismaService.review.delete({ where: { id } });
    });

    it('401', async () => {
      return request(app.getHttpServer()).get('/api/reviews/0').expect(401);
    });

    it('403', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      await request(app.getHttpServer())
        .get(`/api/reviews/${id}`)
        .set('Cookie', [anotherAccessTokenCookie])
        .expect(403);

      await prismaService.review.delete({ where: { id } });
    });

    it('404', async () => {
      await request(app.getHttpServer())
        .get('/api/reviews/0')
        .set('Cookie', [accessTokenCookie])
        .expect(404);
    });
  });

  describe('/api/reviews (GET)', () => {
    it('200', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      const page = 1;
      const { body } = await request(app.getHttpServer())
        .get(`/api/reviews?page=${page}`)
        .set('Cookie', [accessTokenCookie])
        .expect(200);
      validateDto(ReviewsDto, body);

      await prismaService.review.delete({ where: { id } });
    });

    it('400', async () => {
      await request(app.getHttpServer())
        .get('/api/reviews?page=a')
        .set('Cookie', [accessTokenCookie])
        .expect(400);
    });

    it('401', async () => {
      await request(app.getHttpServer()).get('/api/reviews?page=1').expect(401);
    });
  });

  describe('/api/reviews/count (GET)', () => {
    it('200', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/reviews/count`)
        .set('Cookie', [accessTokenCookie])
        .expect(200);
      validateDto(ReviewCountDto, body);
    });

    it('401', async () => {
      await request(app.getHttpServer()).get('/api/reviews/count').expect(401);
    });
  });

  describe('/api/reviews/:id (PATCH)', () => {
    it('200', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };
      const { body } = await request(app.getHttpServer())
        .patch(`/api/reviews/${id}`)
        .set('Cookie', [accessTokenCookie])
        .send(patchReviewDto)
        .expect(200);
      validateDto(ReviewDto, body);

      await prismaService.review.delete({ where: { id } });
    });

    it('400', async () => {
      await request(app.getHttpServer())
        .patch('/api/reviews/1')
        .send({
          text: 'new-text',
          rating: 0
        })
        .set('Cookie', [accessTokenCookie])
        .expect(400);
    });

    it('401', async () => {
      return request(app.getHttpServer()).patch('/api/reviews/0').expect(401);
    });

    it('403', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };
      await request(app.getHttpServer())
        .patch(`/api/reviews/${id}`)
        .send(patchReviewDto)
        .set('Cookie', [anotherAccessTokenCookie])
        .expect(403);

      await prismaService.review.delete({ where: { id } });
    });

    it('404', async () => {
      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch('/api/reviews/0')
        .send(patchReviewDto)
        .set('Cookie', [accessTokenCookie])
        .expect(404);
    });
  });

  describe('/api/reviews/:id (DELETE)', () => {
    it('204', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      await request(app.getHttpServer())
        .delete(`/api/reviews/${id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(204);
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/reviews/0').expect(401);
    });

    it('403', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      await request(app.getHttpServer())
        .delete(`/api/reviews/${id}`)
        .set('Cookie', [anotherAccessTokenCookie])
        .expect(403);

      await prismaService.review.delete({ where: { id } });
    });

    it('404', async () => {
      await request(app.getHttpServer())
        .delete('/api/reviews/0')
        .set('Cookie', [accessTokenCookie])
        .expect(404);
    });
  });
});
