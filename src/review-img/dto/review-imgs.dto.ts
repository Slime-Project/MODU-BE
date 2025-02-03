import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ItemsDto } from '@/common/dto/items.dto';
import { ReviewImgDto } from '@/review-img/dto/review-img.dto';

export class ReviewImgsDto extends ItemsDto {
  @ApiProperty({
    type: [ReviewImgDto]
  })
  @Expose()
  @Type(() => ReviewImgDto)
  @ValidateNested()
  reviewImgs: ReviewImgDto[];
}
