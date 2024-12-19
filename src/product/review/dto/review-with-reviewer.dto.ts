import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateIf, ValidateNested } from 'class-validator';

import { ReviewDto } from '@/review/dto/review.dto';
import { UserDto } from '@/user/dto/user.dto';

export class ReviewWithReviewerDto extends OmitType(ReviewDto, ['userId']) {
  @ApiProperty({
    type: UserDto,
    nullable: true
  })
  @Expose()
  @Type(() => UserDto)
  @ValidateIf(o => o.reviewer !== null)
  @ValidateNested()
  reviewer: UserDto | null;
}
