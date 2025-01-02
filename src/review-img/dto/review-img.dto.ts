import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, Min, ValidateNested } from 'class-validator';

import { ReviewDto } from './review.dto';

export class ReviewImgDto {
  @ApiProperty({
    description: 'The unique identifier of the review img',
    example: 1
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Expose()
  readonly id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly url: string;

  @ApiProperty({
    type: [ReviewDto]
  })
  @Expose()
  @Type(() => ReviewDto)
  @ValidateNested()
  readonly review: ReviewDto;
}
