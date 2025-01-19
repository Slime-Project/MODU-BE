import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { FindReviewImgsDto } from './dto/find-review-imgs.dto';
import { ReviewImgsDto } from './dto/review-imgs.dto';
import { ReviewImgService } from './review-img.service';

@Controller('products/:id/review-imgs')
@ApiTags('review img')
export class ReviewImgController {
  constructor(private readonly service: ReviewImgService) {}

  @ApiOperation({
    summary: 'Get product review imgs'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewImgsDto
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
    @Param('id', ParseIntPipe) productId: number,
    @Query() findReviewImgsDto: FindReviewImgsDto
  ) {
    const reviewImgs = await this.service.findMany(findReviewImgsDto, productId);
    return plainToInstance(ReviewImgsDto, reviewImgs);
  }
}
