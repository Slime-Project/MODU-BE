import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ItemsDto } from '@/common/dto/items.dto';

import { ReviewDto } from './review.dto';

export class ReviewsDto extends ItemsDto {
  @ApiProperty({
    type: [ReviewDto]
  })
  @Expose()
  @Type(() => ReviewDto)
  @ValidateNested()
  reviews: ReviewDto[];
}
