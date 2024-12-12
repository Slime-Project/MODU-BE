import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { FindProductsDto } from '@/product/dto/find-products.dto';
import { ProductsDto } from '@/product/dto/products.dto';
import { ProductService } from '@/product/product.service';

@ApiTags('product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({
    summary: 'Get products'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ProductsDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query fields'
  })
  @Get('')
  async findMany(@Query() findProductsDto: FindProductsDto) {
    const products = await this.productService.findMany(findProductsDto);
    return plainToInstance(ProductsDto, products);
  }
}
