import { INestApplication } from '@nestjs/common';
import { Product } from '@prisma/client';
import * as request from 'supertest';

import { PrismaService } from '@/prisma/prisma.service';
import { NaverProductDto } from '@/product/dto/naver-product.dto';
import { ProductDto } from '@/product/dto/product.dto';
import { ProductsDto } from '@/product/dto/products.dto';
import { ProductModule } from '@/product/product.module';
import { ProductService } from '@/product/product.service';
import {
  createProduct,
  createTestingApp,
  deleteProduct,
  validateDto
} from '@/utils/integration-test';

describe('ProductController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let productService: ProductService;

  let product: Product;

  beforeAll(async () => {
    app = await createTestingApp([ProductModule]);
    prismaService = app.get(PrismaService);
    productService = app.get(ProductService);

    product = await createProduct(prismaService, '3');
  });

  afterAll(async () => {
    await deleteProduct(prismaService, product.id);
  });

  describe('/api/products/:id (GET)', () => {
    it('200', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/products/${product.id}`)
        .expect(200);
      validateDto(ProductDto, body);
    });

    it('404', async () => {
      await request(app.getHttpServer()).get('/api/products/0').expect(404);
    });
  });

  describe('/api/products (GET)', () => {
    it('200', async () => {
      const naverProduct: NaverProductDto = {
        title: product.title,
        img: product.img,
        link: product.link,
        price: product.price,
        seller: product.seller,
        naverProductId: product.naverProductId
      };
      productService.searchProductsOnNaver = jest.fn().mockResolvedValue({
        products: [naverProduct],
        total: 1
      });
      const { body } = await request(app.getHttpServer())
        .get('/api/products?page=1&query=apple')
        .expect(200);
      validateDto(ProductsDto, body);
    });
  });
});
