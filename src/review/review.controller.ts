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
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { CreateReviewDto } from '@/review/dto/create-review.dto';
import { FindReviewResDto } from '@/review/dto/find-review-res.dto';
import { FindReviewsResDto } from '@/review/dto/find-reviews-res.dto';
import { FindReviewsDto } from '@/review/dto/find-reviews.dto';
import { UpdateReviewResDto } from '@/review/dto/update-review-res.dto';
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
    type: CreateReviewResDto
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
    return plainToInstance(CreateReviewResDto, review);
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
    summary: 'Get a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: FindReviewResDto
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
    return plainToInstance(FindReviewResDto, review);
  }

  @ApiOperation({
    summary: 'Get product reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: FindReviewsResDto
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
    return plainToInstance(FindReviewsResDto, reviews);
  }

  @ApiOperation({
    summary: 'Update a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: UpdateReviewResDto
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
    return plainToInstance(UpdateReviewResDto, review);
  }
}
