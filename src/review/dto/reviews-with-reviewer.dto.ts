import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ItemsDto } from '@/common/dto/items.dto';

import { ReviewWithReviewerDto } from './review-with-reviewer.dto';

export class ReviewsWithReviwerDto extends ItemsDto {
  @ApiProperty({
    type: [ReviewWithReviewerDto]
  })
  @Expose()
  @Type(() => ReviewWithReviewerDto)
  @ValidateNested()
  reviews: ReviewWithReviewerDto[];
}
