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

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { GetReviewResDto } from '@/review/dto/get-review-res.dto';
import { GetReviewsReqQueryDto } from '@/review/dto/get-reviews-req-query.dto';
import { GetReviewsResDto } from '@/review/dto/get-reviews-res.dto';
import { PatchReviewReqDto } from '@/review/dto/patch-review-req.dto';
import { PatchReviewResDto } from '@/review/dto/patch-review-res.dto';
import { ReviewService } from '@/review/review.service';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

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
  @UseGuards(RefreshTokenGuard)
  @Post('')
  async create(
    @Req() req: RefreshTokenGuardReq,
    @Body() body: CreateReviewReqDto,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    const review = await this.reviewService.create({
      userId: req.id,
      ...body,
      productId
    });
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
  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  @Delete(':id')
  async delete(
    @Req() { id }: RefreshTokenGuardReq,
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
    type: GetReviewResDto
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
  @UseGuards(RefreshTokenGuard)
  @Get(':id')
  async get(
    @Req() req: RefreshTokenGuardReq,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    const review = await this.reviewService.findOne(req.id, productId, reviewId);
    return plainToInstance(GetReviewResDto, review);
  }

  @ApiOperation({
    summary: 'Get product reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetReviewsResDto
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
  async getMany(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: GetReviewsReqQueryDto
  ) {
    const reviews = await this.reviewService.findMany({
      productId,
      sortBy: query.sortBy,
      orderBy: query.orderBy,
      page: query.page
    });
    return plainToInstance(GetReviewsResDto, reviews);
  }

  @ApiOperation({
    summary: 'Update a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: PatchReviewResDto
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
  @UseGuards(RefreshTokenGuard)
  @Patch(':id')
  async patch(
    @Req() req: RefreshTokenGuardReq,
    @Body() data: PatchReviewReqDto,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    const review = await this.reviewService.update({
      userId: req.id,
      productId,
      id: reviewId,
      data
    });
    return plainToInstance(PatchReviewResDto, review);
  }
}
