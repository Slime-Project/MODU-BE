import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { PrismaService } from '@/prisma/prisma.service';
import { NaverProductDto } from '@/product/dto/naver-product.dto';
import { ProductService } from '@/product/product.service';
import { SearchResDto } from '@/search/dto/search-res.dto';
import { SearchModule } from '@/search/search.module';
import {
  createProduct,
  createTestingApp,
  deleteProduct,
  validateDto
} from '@/utils/integration-test';

describe('SearchController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let productService: ProductService;

  beforeAll(async () => {
    app = await createTestingApp([SearchModule]);
    prismaService = app.get(PrismaService);
    productService = app.get(ProductService);
  });

  describe('/api/search (GET)', () => {
    it('200', async () => {
      const product = await createProduct(prismaService, '1');
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
        .get('/api/search?query=apple')
        .expect(200);
      validateDto(SearchResDto, body);

      await deleteProduct(prismaService, product.id);
    });

    it('400', async () => {
      await request(app.getHttpServer()).get('/api/search').expect(400);
    });
  });
});
