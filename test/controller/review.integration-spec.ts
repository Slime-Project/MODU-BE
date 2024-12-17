import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewsDto } from '@/product/review/dto/reviews.dto';
import { ReviewModule } from '@/review/review.module';
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
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  const createReview = async (userId: string, productId: number, rating?: number) => {
    return prismaService.review.create({
      data: { userId, productId, text: '', rating: rating || 1 }
    });
  };

  describe('/api/products/:productId/reviews (GET)', () => {
    it('200', async () => {
      const userId1 = '2';
      const userId2 = '3';
      const { accessTokenCookie } = await createUser(app, userId1);
      await createUser(app, userId2);
      const product = await createProduct(prismaService);
      await Promise.all([
        createReview(userId1, product.id, 1),
        createReview(userId2, product.id, 3)
      ]);
      const page = 1;
      const { body } = await request(app.getHttpServer())
        .get(`/api/reviews?page=${page}`)
        .set('Cookie', [accessTokenCookie])
        .expect(200);
      validateDto(ReviewsDto, body);

      await Promise.allSettled([
        deleteUser(prismaService, userId1),
        deleteUser(prismaService, userId2),
        deleteProduct(prismaService, product.id)
      ]);
    });

    it('400', async () => {
      const userId = '2';
      const { accessTokenCookie } = await createUser(app, userId);

      await request(app.getHttpServer())
        .get('/api/reviews?page=a')
        .set('Cookie', [accessTokenCookie])
        .expect(400);

      await deleteUser(prismaService, userId);
    });

    it('401', async () => {
      await request(app.getHttpServer()).get('/api/reviews?page=1').expect(401);
    });
  });
});
