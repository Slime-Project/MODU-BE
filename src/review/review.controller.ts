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

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { GetReviewsReqQueryDto } from '@/review/dto/get-reviews-req-query.dto';
import { PutReviewReqDto } from '@/review/dto/put-review-req.dto';
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
    description: 'created'
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
    return this.reviewService.create({
      userId: req.id,
      ...body,
      productId
    });
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
    description: 'Success'
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
    return this.reviewService.findOne(req.id, productId, reviewId);
  }

  @ApiOperation({
    summary: 'Get product reviews'
  })
  @ApiResponse({
    status: 200,
    description: 'Success'
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
    return this.reviewService.findMany({
      productId,
      sortBy: query.sortBy,
      orderBy: query.orderBy,
      page: query.page
    });
  }

  @ApiOperation({
    summary: 'Update a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success'
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
    @Body() data: PutReviewReqDto,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    return this.reviewService.update({
      userId: req.id,
      productId,
      id: reviewId,
      data
    });
  }
}
