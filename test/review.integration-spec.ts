import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { ReviewModule } from '@/review/review.module';
import { createTestingApp, createUser, deleteUser } from '@/utils/integration-test';

describe('ReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  const createProduct = async () => {
    return prismaService.product.create({
      data: { title: '', link: '', price: 1, seller: '' }
    });
  };

  const deleteProduct = async (id: number) => {
    return prismaService.product.delete({
      where: {
        id
      }
    });
  };

  const createReview = async (userId: string, productId: number) => {
    return prismaService.review.create({
      data: { userId, productId, text: '', rating: 1 }
    });
  };

  describe('/api/products/:productId/reviews (POST)', () => {
    it('201', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct();

      const review: CreateReviewResDto = {
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
      await deleteProduct(product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });
  });

  describe('/api/products/:productId/reviews/:id (DELETE)', () => {
    it('201', async () => {
      const userId = '3456789012';
      const { refreshTokenCookie } = await createUser(app, userId);
      const product = await createProduct();
      const review = await createReview(userId, product.id);

      await request(app.getHttpServer())
        .delete(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(204);

      await deleteUser(prismaService, userId);
      await deleteProduct(product.id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/products/1/reviews/1').expect(401);
    });

    it('403', async () => {
      const userId = '3456789012';
      const anotherUserId = '4567890123';
      const { refreshTokenCookie } = await createUser(app, userId);
      await createUser(app, anotherUserId);
      const product = await createProduct();
      const review = await createReview(anotherUserId, product.id);

      await request(app.getHttpServer())
        .delete(`/api/products/${review.productId}/reviews/${review.id}`)
        .set('Cookie', [refreshTokenCookie])
        .expect(403);

      await deleteUser(prismaService, userId);
      await deleteUser(prismaService, anotherUserId);
      await deleteProduct(product.id);
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
});
