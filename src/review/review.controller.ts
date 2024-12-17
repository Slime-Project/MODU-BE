import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { ReviewsDto } from '@/product/review/dto/reviews.dto';
import { ReviewService } from '@/review/review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

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
    description: 'Bad Request - Invalid or missing query fields'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @UseGuards(AccessTokenGuard)
  @Get('')
  async findMany(@Req() { id }: TokenGuardReq, @Query() findReviewsDto: FindReviewsDto) {
    const reviews = await this.service.findMany(findReviewsDto, id);
    return plainToInstance(ReviewsDto, reviews);
  }
}
