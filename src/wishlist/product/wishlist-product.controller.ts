import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { FindWishlistProductsDto } from '@/wishlist/product/dto/find-wishlist-products.dto';
import { WishlistProductDto } from '@/wishlist/product/dto/wishlist-product.dto';
import { WishlistProductsDto } from '@/wishlist/product/dto/wishlist-products.dto';
import { WishlistProductService } from '@/wishlist/product/wishlist-product.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('wishlist/products')
export class WishlistProductController {
  constructor(private readonly service: WishlistProductService) {}

  @ApiOperation({
    summary: 'Add a product to user wishlist'
  })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: WishlistProductDto
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
    return plainToInstance(WishlistProductDto, product);
  }

  @ApiOperation({
    summary: 'Remove a product to user wishlist'
  })
  @ApiResponse({
    status: 204,
    description: 'No Content'
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
    description: 'Not Found - Product is not present in the wishlist'
  })
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Req() { id }: TokenGuardReq, @Param('id', ParseIntPipe) productId: number) {
    await this.service.remove(id, productId);
  }

  @ApiOperation({
    summary: 'Get wishlist products'
  })
  @ApiResponse({
    status: 200,
    description: 'Ok'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @UseGuards(AccessTokenGuard)
  @Get('')
  async findMany(
    @Req() { id }: TokenGuardReq,
    @Query() findWishlistProductDto: FindWishlistProductsDto
  ) {
    const result = await this.service.findMany(id, findWishlistProductDto);
    return plainToInstance(WishlistProductsDto, result);
  }
}
