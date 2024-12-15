import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { FindItemsDto } from '@/common/dto/find-items.dto';

import { OrderBy, SortBy } from '@/types/review.type';

export class FindReviewsDto extends FindItemsDto {
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
