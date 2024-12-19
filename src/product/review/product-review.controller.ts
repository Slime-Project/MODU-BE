import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ReviewDto } from '../../review/dto/review.dto';
import { AccessTokenGuard } from '@/auth/guard/access-token.guard';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { ReviewCountDto } from './dto/review-count.dto';
import { ReviewsWithReviwerDto } from './dto/reviews-with-reviewer.dto';
import { ProductReviewService } from './product-review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('products/:productId/reviews')
@ApiTags('review')
export class ProductReviewController {
  constructor(private readonly service: ProductReviewService) {}

  @ApiOperation({
    summary: 'Create a product review'
  })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: ReviewDto
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
    status: 409,
    description: 'Conflict - User has already submitted a review for this product'
  })
  @UseGuards(AccessTokenGuard)
  @Post('')
  async create(
    @Req() { id }: TokenGuardReq,
    @Body() createReviewDto: CreateReviewDto,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    const review = await this.service.create(createReviewDto, id, productId);
    return plainToInstance(ReviewDto, review);
  }

  @ApiOperation({
    summary: 'Get product review count'
  })
  @ApiResponse({
    status: 200,
    description: 'Ok',
    type: ReviewCountDto
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Product not found'
  })
  @Get('count')
  async count(@Param('productId', ParseIntPipe) productId: number) {
    const count = await this.service.count(productId);
    return plainToInstance(ReviewCountDto, count);
  }

  @ApiOperation({
    summary: 'Get product reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewsWithReviwerDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing query fields'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Product not found'
  })
  @Get('')
  async findMany(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() findReviewsDto: FindReviewsDto
  ) {
    const reviews = await this.service.findMany(findReviewsDto, productId);
    return plainToInstance(ReviewsWithReviwerDto, reviews);
  }
}
