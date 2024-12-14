import { Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { ProductsWishlistDto } from '@/wishlist/products/dto/products-wishlist.dto';
import { ProductsWishlistService } from '@/wishlist/products/products-wishlist.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('wishlist/products')
export class ProductsWishlistController {
  constructor(private readonly service: ProductsWishlistService) {}

  @ApiOperation({
    summary: 'Add a product to user wishlist'
  })
  @ApiResponse({
    status: 201,
    description: 'created',
    type: ProductsWishlistDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Product not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User has already added this product to the wishlist'
  })
  @UseGuards(AccessTokenGuard)
  @Post(':id')
  async create(@Req() { id }: TokenGuardReq, @Param('id', ParseIntPipe) productId: number) {
    const product = await this.service.create(id, productId);
    return plainToInstance(ProductsWishlistDto, product);
  }
}
