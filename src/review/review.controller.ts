import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UnsupportedMediaTypeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import { reviewImgInterceptor } from '@/interceptor/review.interceptor';
import { FindReviewsDto } from '@/product/review/dto/find-reviews.dto';
import { ReviewCountDto } from '@/review/dto/review-count.dto';
import { isValidFileContent } from '@/utils/file';

import { ReviewDto } from './dto/review.dto';
import { ReviewsDto } from './dto/reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('reviews')
@ApiTags('review')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @ApiOperation({
    summary: 'Get product review count'
  })
  @ApiResponse({
    status: 200,
    description: 'Ok',
    type: ReviewCountDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @UseGuards(AccessTokenGuard)
  @Get('count')
  async count(@Req() { id }: TokenGuardReq) {
    const count = await this.service.count(id);
    return plainToInstance(ReviewCountDto, count);
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

  @ApiOperation({
    summary: 'Get a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: ReviewDto
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Review not found'
  })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) reviewId: number) {
    const review = await this.service.findOne(reviewId);
    return plainToInstance(ReviewDto, review);
  }

  @ApiOperation({
    summary: 'Update a product review'
  })
  @ApiResponse({
    status: 200,
    description: 'Ok',
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
    status: 403,
    description: 'Forbidden - You are not authorized to patch this review'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Review not found'
  })
  @ApiResponse({
    status: 413,
    description: 'Payload Too Large - File too large'
  })
  @ApiResponse({
    status: 415,
    description: 'Unsupported Media Type - Only JPEG or PNG files are allowed'
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(reviewImgInterceptor)
  @Patch(':id')
  async update(
    @Req() req: TokenGuardReq,
    @Body() updateReviewDto: UpdateReviewDto,
    @Param('id', ParseIntPipe) reviewId: number,
    @UploadedFiles() imgs?: Express.Multer.File[]
  ) {
    if (imgs) {
      imgs.forEach(img => {
        if (!isValidFileContent(img)) {
          throw new UnsupportedMediaTypeException('Only JPEG or PNG files are allowed');
        }
      });
    }

    const review = await this.service.update({
      userId: req.id,
      reviewId,
      updateReviewDto,
      newImgs: imgs
    });
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
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You are not authorized to delete this review'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Review not found'
  })
  @UseGuards(AccessTokenGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(@Req() { id }: TokenGuardReq, @Param('id', ParseIntPipe) reviewId: number) {
    await this.service.remove(id, reviewId);
  }
}
