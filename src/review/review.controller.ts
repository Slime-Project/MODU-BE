import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewsDto } from '@/review/dto/find-reviews.dto';
import { ReviewCountDto } from '@/review/dto/review-count.dto';
import { ReviewDto } from '@/review/dto/review.dto';
import { ReviewsDto } from '@/review/dto/reviews.dto';
import { UpdateReviewDto } from '@/review/dto/update-review.dto';
import { ReviewService } from '@/review/review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('products/:productId/reviews')
@ApiTags('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({
    summary: 'Create a product review'
  })
  @ApiResponse({
    status: 201,
    description: 'created',
    type: ReviewDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token, or login required'
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
    const review = await this.reviewService.create(createReviewDto, id, productId);
    return plainToInstance(ReviewDto, review);
  }

  @ApiOperation({
    summary: 'Delete a product review'
  })
  @ApiResponse({
    status: 204,
    description: 'No Content'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token, or login required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You are not authorized to delete this review'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found'
  })
  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Delete(':id')
  async delete(
    @Req() { id }: TokenGuardReq,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    await this.reviewService.delete(id, productId, reviewId);
  }

  @ApiOperation({
    summary: 'Get product review count'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewCountDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query fields'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found'
  })
  @Get('count')
  async count(@Param('productId', ParseIntPipe) productId: number) {
    const count = await this.reviewService.count(productId);
    return plainToInstance(ReviewCountDto, count);
  }

  @ApiOperation({
    summary: 'Get a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token, or login required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You are not authorized to delete this review'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found'
  })
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  async findOne(
    @Req() req: TokenGuardReq,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    const review = await this.reviewService.findOne(req.id, productId, reviewId);
    return plainToInstance(ReviewDto, review);
  }

  @ApiOperation({
    summary: 'Get product reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewsDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query fields'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found'
  })
  @Get('')
  async findMany(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() findReviewsDto: FindReviewsDto
  ) {
    const reviews = await this.reviewService.findMany(findReviewsDto, productId);
    return plainToInstance(ReviewsDto, reviews);
  }

  @ApiOperation({
    summary: 'Update a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token, or login required'
  })
  @ApiResponse({
    status: 403,
    description: 'You are not authorized to delete this review'
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found'
  })
  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  async update(
    @Req() req: TokenGuardReq,
    @Body() updateReviewDto: UpdateReviewDto,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    const review = await this.reviewService.update({
      userId: req.id,
      productId,
      id: reviewId,
      updateReviewDto
    });
    return plainToInstance(ReviewDto, review);
  }
}
