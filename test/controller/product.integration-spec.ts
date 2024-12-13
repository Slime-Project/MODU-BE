import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { PrismaService } from '@/prisma/prisma.service';
import { NaverProductDto } from '@/product/dto/naver-product.dto';
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

  beforeEach(async () => {
    app = await createTestingApp([ProductModule]);
    prismaService = app.get(PrismaService);
    productService = app.get(ProductService);
  });

  describe('/api/products (GET)', () => {
    it('200', async () => {
      const product = await createProduct(prismaService, '2');
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
        totalProducts: 1
      });
      const { body } = await request(app.getHttpServer())
        .get('/api/products?page=1&query=apple')
        .expect(200);
      validateDto(ProductsDto, body);

      await deleteProduct(prismaService, product.id);
    });
  });
});
