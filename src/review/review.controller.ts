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
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { GetReviewResDto } from '@/review/dto/get-review-res.dto';
import { PutReviewReqDto } from '@/review/dto/put-review-req.dto';
import { PutReviewResDto } from '@/review/dto/put-review-res.dto';
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
  @UseGuards(RefreshTokenGuard)
  @Post('')
  async create(
    @Req() req: RefreshTokenGuardReq,
    @Body() body: CreateReviewReqDto,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    const { id, text, rating, createdAt } = await this.reviewService.create({
      userId: req.id,
      ...body,
      productId
    });
    const res: CreateReviewResDto = {
      id,
      text,
      rating,
      createdAt
    };
    return res;
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
    const { id, text, rating, createdAt } = await this.reviewService.findOne(
      req.id,
      productId,
      reviewId
    );
    const res: GetReviewResDto = {
      id,
      text,
      rating,
      createdAt
    };
    return res;
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
    const { id, text, rating, createdAt } = await this.reviewService.update({
      userId: req.id,
      productId,
      id: reviewId,
      data
    });
    const res: PutReviewResDto = {
      id,
      text,
      rating,
      createdAt
    };
    return res;
  }
}
