import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/product/review/dto/create-review.dto';
import { ReviewCountDto } from '@/product/review/dto/review-count.dto';
import { ReviewsDto } from '@/product/review/dto/reviews.dto';
import { ProductReviewModule } from '@/product/review/product-review.module';
import { ReviewDto } from '@/review/dto/review.dto';
import {
  createProduct,
  createTestingApp,
  createUser,
  deleteProduct,
  deleteUser,
  validateDto
} from '@/utils/integration-test';

describe('ProductReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    app = await createTestingApp([ProductReviewModule, AuthModule]);
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
      const { accessTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      const req: CreateReviewDto = {
        text: 'Great product!',
        rating: 5
      };
      const { body } = await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [accessTokenCookie])
        .send(req)
        .expect(201);
      validateDto(ReviewDto, body);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });

    it('400', async () => {
      const userId = '3456789012';
      const { accessTokenCookie } = await createUser(app, userId);

      await request(app.getHttpServer())
        .post('/api/products/1/reviews')
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 0 })
        .expect(400);

      await deleteUser(prismaService, userId);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });

    it('404', async () => {
      const userId = '3456789012';
      const { accessTokenCookie } = await createUser(app, userId);

      await request(app.getHttpServer())
        .post('/api/products/1/reviews')
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 5 })
        .expect(404);

      await deleteUser(prismaService, userId);
    });

    it('409', async () => {
      const userId = '3456789012';
      const { accessTokenCookie } = await createUser(app, userId);
      const product = await createProduct(prismaService);
      await createReview(userId, product.id);

      await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 5 })
        .expect(409);

      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
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
      validateDto(ReviewsDto, body);

      await Promise.allSettled([
        deleteUser(prismaService, userId1),
        deleteUser(prismaService, userId2),
        deleteProduct(prismaService, product.id)
      ]);
    });

    it('400', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews?page=a').expect(400);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews?page=1').expect(404);
    });
  });

  describe('/api/products/:productId/reviews/count (GET)', () => {
    it('200', async () => {
      const product = await createProduct(prismaService);
      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${product.id}/reviews/count`)
        .expect(200);
      validateDto(ReviewCountDto, body);

      await deleteProduct(prismaService, product.id);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews/count').expect(404);
    });
  });
});
