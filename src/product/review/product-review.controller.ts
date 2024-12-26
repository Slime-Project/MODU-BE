import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ReviewDto } from '../../review/dto/review.dto';
import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { reviewImgInterceptor } from '@/interceptor/review.interceptor';

import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
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
  @UseInterceptors(reviewImgInterceptor)
  @Post('')
  async create(
    @Req() { id }: TokenGuardReq,
    @Body() createReviewDto: CreateReviewDto,
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() imgs: Express.Multer.File[]
  ) {
    const review = await this.service.create({ createReviewDto, userId: id, productId, imgs });
    return plainToInstance(ReviewDto, review);
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
