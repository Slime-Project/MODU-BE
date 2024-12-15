import { INestApplication } from '@nestjs/common';
import { Product } from '@prisma/client';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createProduct,
  createTestingApp,
  createUser,
  deleteProduct,
  deleteUser,
  validateDto
} from '@/utils/integration-test';
import { WishlistProductDto } from '@/wishlist/product/dto/wishlist-product.dto';
import { WishlistProductModule } from '@/wishlist/product/wishlist-product.module';

describe('WishlistProductController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  let userId: string;
  let accessTokenCookie: string;
  let product: Product;

  beforeAll(async () => {
    app = await createTestingApp([WishlistProductModule, AuthModule]);
    prismaService = app.get(PrismaService);

    userId = '1';
    const result = await createUser(app, userId);
    accessTokenCookie = result.accessTokenCookie;
    product = await createProduct(prismaService);
  });

  afterAll(async () => {
    await deleteUser(prismaService, userId);
    await deleteProduct(prismaService, product.id);
  });

  describe('/api/wishlist/products/:id (POST)', () => {
    it('201', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/wishlist/products/${product.id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(201);
      validateDto(WishlistProductDto, body);

      prismaService.wishlistItem.delete({
        where: { userId_productId: { userId, productId: product.id } }
      });
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/wishlist/products/1').expect(401);
    });

    it('404', async () => {
      await request(app.getHttpServer())
        .post('/api/wishlist/products/1')
        .set('Cookie', [accessTokenCookie])
        .expect(404);
    });

    it('409', async () => {
      prismaService.wishlistItem.create({
        data: { userId, productId: product.id }
      });

      await request(app.getHttpServer())
        .post(`/api/wishlist/products/${product.id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(409);
    });
  });

  describe('/api/wishlist/products/:id (DELETE)', () => {
    it('204', async () => {
      prismaService.wishlistItem.create({
        data: { userId, productId: product.id }
      });

      await request(app.getHttpServer())
        .delete(`/api/wishlist/products/${product.id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(204);
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/wishlist/products/1').expect(401);
    });

    it('404', async () => {
      await request(app.getHttpServer())
        .delete(`/api/wishlist/products/${product.id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(404);
    });
  });
});
