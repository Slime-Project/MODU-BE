import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateIf, ValidateNested } from 'class-validator';

import { ProfileDto } from '@/user/dto/profile.dto';

import { ReviewDto } from './review.dto';

export class ReviewWithReviewerDto extends ReviewDto {
  @ApiProperty({
    type: ProfileDto,
    nullable: true
  })
  @Expose()
  @Type(() => ProfileDto)
  @ValidateIf(o => o.reviewer !== null)
  @ValidateNested()
  reviewer: ProfileDto | null;
}
