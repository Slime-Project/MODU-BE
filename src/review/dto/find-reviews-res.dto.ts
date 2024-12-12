import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ReviewResDto } from '@/review/dto/review-res.dto';
import { ReviewMetaDto } from '@/review/dto/reviews-meta.dto';

export class FindReviewsResDto {
  @ApiProperty({
    type: [ReviewResDto]
  })
  @IsNotEmpty()
  @Expose()
  @Type(() => ReviewResDto)
  @ValidateNested()
  reviews: ReviewResDto[];

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @Type(() => ReviewMetaDto)
  @ValidateNested()
  meta: ReviewMetaDto;
}
