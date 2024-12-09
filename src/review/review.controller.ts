import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
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
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
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
    description: 'Invalid or expired refresh token, or login required'
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
  @HttpCode(204)
  @Delete(':id')
  async delete(
    @Req() { id }: RefreshTokenGuardReq,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) reviewId: number
  ) {
    await this.reviewService.delete(id, productId, reviewId);
  }
}
