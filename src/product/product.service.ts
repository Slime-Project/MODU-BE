import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';

import { PRODUCTS_PAGE_SIZE } from '@/constants/product';
import { PrismaService } from '@/prisma/prisma.service';
import { FindProductsDto } from '@/product/dto/find-products.dto';
import { NaverProductDto } from '@/product/dto/naver-product.dto';
import { calculateTotalPages } from '@/utils/page';

import { ProductsData } from '@/types/product.type';

@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async searchProductsOnNaver(findProductsDto: FindProductsDto) {
    const URL = 'https://openapi.naver.com/v1/search/shop.json';
    const CLIENT_ID = this.configService.get('NAVER_CLIENT_ID');
    const CLIENT_SECRET = this.configService.get('NAVER_CLIENT_SECRET');

    const { data } = await axios.get(URL, {
      params: {
        query: findProductsDto.query,
        start: (findProductsDto.page - 1) * PRODUCTS_PAGE_SIZE + 1,
        sort: findProductsDto.sort || 'sim',
        display: PRODUCTS_PAGE_SIZE
      },
      headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET
      }
    });
    const products: NaverProductDto[] = data.items.map(product =>
      plainToInstance(NaverProductDto, product, { excludeExtraneousValues: true })
    );
    return { products, total: data.total as number };
  }

  async findMany(findProductsDto: FindProductsDto) {
    const { products: naverProducts, total } = await this.searchProductsOnNaver(findProductsDto);

    const products = await Promise.all(
      naverProducts.map(product =>
        this.prismaService.product.upsert({
          where: { naverProductId: product.naverProductId },
          update: product,
          create: product
        })
      )
    );
    const totalPages = calculateTotalPages(total, PRODUCTS_PAGE_SIZE);
    const productsData: ProductsData = {
      products,
      pageSize: PRODUCTS_PAGE_SIZE,
      total,
      totalPages
    };
    return productsData;
  }

  async findOne(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
