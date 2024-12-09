import { Body, Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { CreateReviewReqDto } from '@/review/dto/create-review-req.dto';
import { CreateReviewResDto } from '@/review/dto/create-review-res.dto';
import { ReviewService } from '@/review/review.service';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('products/:id/reviews')
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
    @Req() { id }: RefreshTokenGuardReq,
    @Body() { text, rating }: CreateReviewReqDto,
    @Param('id', ParseIntPipe) productId: number
  ) {
    const review = await this.reviewService.create({ userId: BigInt(id), text, rating, productId });
    return { ...review, userId: Number(review.userId) };
  }
}
