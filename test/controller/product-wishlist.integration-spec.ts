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
import { ProductWishlistDto } from '@/wishlist/product/dto/product-wishlist.dto';
import { ProductWishlistModule } from '@/wishlist/product/product-wishlist.module';

describe('ProductWishlistController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp([ProductWishlistModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  describe('/api/wishlist/products/:id (POST)', () => {
    let userId: string;
    let accessTokenCookie: string;
    let product: Product;

    beforeAll(async () => {
      userId = '1';
      const result = await createUser(app, userId);
      accessTokenCookie = result.accessTokenCookie;
      product = await createProduct(prismaService);
    });

    it('201', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/wishlist/products/${product.id}`)
        .set('Cookie', [accessTokenCookie])
        .expect(201);
      validateDto(ProductWishlistDto, body);

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

    afterAll(async () => {
      await deleteUser(prismaService, userId);
      await deleteProduct(prismaService, product.id);
    });
  });
});
