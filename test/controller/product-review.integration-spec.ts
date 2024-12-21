import { INestApplication } from '@nestjs/common';
import { Product } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/product/review/dto/create-review.dto';
import { ReviewsWithReviwerDto } from '@/product/review/dto/reviews-with-reviewer.dto';
import { ProductReviewModule } from '@/product/review/product-review.module';
import { ReviewDto } from '@/review/dto/review.dto';
import { ReviewModule } from '@/review/review.module';
import { ReviewService } from '@/review/review.service';
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
  let kakaoLoginService: KakaoLoginService;
  let reviewService: ReviewService;

  const userId = '9';
  let accessTokenCookie: string;
  let product: Product;

  beforeAll(async () => {
    app = await createTestingApp([ProductReviewModule, AuthModule, ReviewModule]);
    prismaService = app.get(PrismaService);
    kakaoLoginService = app.get(KakaoLoginService);
    reviewService = app.get(ReviewService);

    const [createdProduct, user] = await Promise.all([
      createProduct(prismaService),
      createUser(app, userId)
    ]);
    accessTokenCookie = user.accessTokenCookie;
    product = createdProduct;
  });

  afterAll(async () => {
    await Promise.allSettled([
      deleteUser(prismaService, userId),
      deleteProduct(prismaService, product.id)
    ]);
  });

  describe('/api/products/:productId/reviews (POST)', () => {
    it('201', async () => {
      const req: CreateReviewDto = {
        text: 'Great product!',
        rating: 5
      };
      const { body } = await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [accessTokenCookie])
        .field('text', req.text)
        .field('rating', req.rating)
        .attach('imgs', 'test/test-img.png')
        .expect(201);
      validateDto(ReviewDto, body);

      const { id } = await prismaService.review.findUnique({
        where: { productId_userId: { productId: product.id, userId } },
        select: { id: true }
      });

      await reviewService.remove(userId, id);
    });

    it('400', async () => {
      await request(app.getHttpServer())
        .post('/api/products/1/reviews')
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 0 })
        .expect(400);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/products/1/reviews').expect(401);
    });

    it('404', async () => {
      await request(app.getHttpServer())
        .post('/api/products/0/reviews')
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 5 })
        .expect(404);
    });

    it('409', async () => {
      await createReview(prismaService, { userId, productId: product.id });

      await request(app.getHttpServer())
        .post(`/api/products/${product.id}/reviews`)
        .set('Cookie', [accessTokenCookie])
        .send({ text: 'Great product!', rating: 5 })
        .expect(409);

      await prismaService.review.delete({
        where: { productId_userId: { productId: product.id, userId } }
      });
    });
  });

  describe('/api/products/:id/reviews (GET)', () => {
    it('200', async () => {
      await createReview(prismaService, { userId, productId: product.id });

      const kakaoUsers: KaKaoUserInfoDto[] = [
        { id: userId, nickname: 'nickname', profileImg: 'url' }
      ];
      kakaoLoginService.findUsers = jest.fn().mockResolvedValue(kakaoUsers);
      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${product.id}/reviews?page=1`)
        .expect(200);
      validateDto(ReviewsWithReviwerDto, body);

      await prismaService.review.delete({
        where: { productId_userId: { productId: product.id, userId } }
      });
    });

    it('400', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews?page=a').expect(400);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0/reviews?page=1').expect(404);
    });
  });
});
