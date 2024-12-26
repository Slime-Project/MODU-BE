import { INestApplication } from '@nestjs/common';
import { Product } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { ReviewCountDto } from '@/review/dto/review-count.dto';
import { ReviewDto } from '@/review/dto/review.dto';
import { ReviewsWithReviwerDto } from '@/review/dto/reviews-with-reviewer.dto';
import { ReviewsDto } from '@/review/dto/reviews.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
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

describe('ReviewController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let kakaoLoginService: KakaoLoginService;
  let reviewService: ReviewService;

  const userId = '2';
  const anotherUserId = '3';
  let accessTokenCookie: string;
  let anotherAccessTokenCookie: string;
  let product: Product;

  beforeAll(async () => {
    app = await createTestingApp([ReviewModule, AuthModule]);
    prismaService = app.get(PrismaService);
    kakaoLoginService = app.get(KakaoLoginService);
    reviewService = app.get(ReviewService);

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

  describe('/api/products/:id/reviews (POST)', () => {
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

  describe('/api/reviews/:id (GET)', () => {
    it('200', async () => {
      const { id } = await createReview(prismaService, { userId, productId: product.id });

      const { body } = await request(app.getHttpServer()).get(`/api/reviews/${id}`).expect(200);
      validateDto(ReviewDto, body);

      await prismaService.review.delete({ where: { id } });
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/reviews/0').expect(404);
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

    it('413', async () => {
      const patchReviewDto: UpdateReviewDto = {
        text: 'new-text',
        rating: 5
      };

      await request(app.getHttpServer())
        .patch('/api/reviews/0')
        .field('text', patchReviewDto.text)
        .field('rating', patchReviewDto.rating)
        .attach('imgs', 'test/large.jpeg')
        .set('Cookie', [accessTokenCookie])
        .expect(413);
    });

    it('415 - fake PNG file', async () => {
      await request(app.getHttpServer())
        .patch('/api/reviews/0')
        .attach('imgs', 'test/fake-png.png')
        .set('Cookie', [accessTokenCookie])
        .expect(415);
    });

    it('415', async () => {
      await request(app.getHttpServer())
        .patch('/api/reviews/0')
        .attach('imgs', 'test/unsupported.md')
        .set('Cookie', [accessTokenCookie])
        .expect(415);
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
