import { INestApplication } from '@nestjs/common';
import { Review } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewModule } from '@/review/review.module';
import { createTestingApp, createUser, deleteUser } from '@/utils/integration-test';

describe('ReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const id = '3456789012';

  beforeEach(async () => {
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  describe('/api/products/:id/reviews (POST)', () => {
    it('201', async () => {
      const { refreshTokenCookie } = await createUser(app, id);
      const product = await prismaService.product.create({
        data: { title: '', link: '', price: 1, seller: '' }
      });

      const review: Review = {
        id: 1,
        userId: id,
        productId: product.id,
        text: 'Great product!',
        rating: 5,
        createdAt: new Date()
      };
      const res = await request(app.getHttpServer())
        .post(`/api/products/${review.productId}/reviews`)
        .set('Cookie', [refreshTokenCookie])
        .send({ text: review.text, rating: review.rating })
        .expect(201);
      expect(res.body).toEqual({
        ...review,
        createdAt: expect.any(String),
        id: expect.any(Number)
      });

      await deleteUser(prismaService, id);
      await prismaService.product.delete({
        where: {
          id: product.id
        }
      });
    });

    it('401', () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });
  });
});
