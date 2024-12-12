import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

import { OrderBy, SortBy } from '@/types/review.type';

export class GetReviewsDto {
  @ApiProperty({
    description: 'Must be an integer greater than or equal to 1',
    example: 1
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  readonly page: number;

  @ApiProperty({
    description: 'If not provided, defaults to "rating"',
    example: 'rating',
    enum: ['rating', 'createdAt'],
    required: false
  })
  @IsOptional()
  @IsIn(['rating', 'createdAt'], { message: 'sortBy must be either rating or createdAt' })
  readonly sortBy?: SortBy;

  @ApiProperty({
    description: 'If not provided, defaults to "desc"',
    example: 'desc',
    enum: ['desc', 'asc'],
    required: false
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'orderBy must be either asc or desc' })
  readonly orderBy?: OrderBy;
}
