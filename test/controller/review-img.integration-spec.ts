import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ReviewImgsDto } from '@/review-img/dto/review-imgs.dto';
import { ReviewImgModule } from '@/review-img/review-img.module';
import {
  createProduct,
  createReview,
  createTestingApp,
  deleteProduct,
  validateDto
} from '@/utils/integration-test';

describe('ReviewImgController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let kakaoLoginService: KakaoLoginService;

  let productId: number;

  beforeAll(async () => {
    app = await createTestingApp([ReviewImgModule]);
    prismaService = app.get(PrismaService);
    kakaoLoginService = app.get(KakaoLoginService);

    const product = await createProduct(prismaService);
    productId = product.id;
  });

  afterAll(async () => {
    await deleteProduct(prismaService, productId);
  });

  describe('/api/products/:id/review-imgs (GET)', () => {
    it('200', async () => {
      const { id } = await createReview(prismaService, { productId });

      kakaoLoginService.findUsers = jest.fn();
      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${productId}/review-imgs?page=1`)
        .expect(200);
      validateDto(ReviewImgsDto, body);

      await prismaService.review.delete({
        where: { id }
      });
    });

    it('400', async () => {
      await request(app.getHttpServer()).get(`/api/products/0/review-imgs?page=a`).expect(400);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0/review-img?page=1').expect(404);
    });
  });
});
