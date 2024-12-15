import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ReviewDto } from '@/review/dto/review.dto';
import { ReviewMetaDto } from '@/review/dto/reviews-meta.dto';

export class ReviewsDto {
  @ApiProperty({
    type: [ReviewDto]
  })
  @Expose()
  @Type(() => ReviewDto)
  @ValidateNested()
  reviews: ReviewDto[];

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @Type(() => ReviewMetaDto)
  @ValidateNested()
  meta: ReviewMetaDto;
}
