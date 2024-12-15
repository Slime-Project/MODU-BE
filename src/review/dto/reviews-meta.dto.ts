import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';

import { REVIEWS_PAGE_SIZE } from '@/constants/review';

export class ReviewMetaDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  readonly page: number;

  @ApiProperty({ example: 10 })
  @IsIn([REVIEWS_PAGE_SIZE])
  @IsNotEmpty()
  @Expose()
  readonly pageSize: typeof REVIEWS_PAGE_SIZE;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalReviews: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalPages: number;
}
