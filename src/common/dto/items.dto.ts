import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';

import { PRODUCTS_PAGE_SIZE } from '@/constants/page';

export class ItemsDto {
  @ApiProperty({ example: 10 })
  @IsIn([PRODUCTS_PAGE_SIZE])
  @IsNotEmpty()
  @Expose()
  readonly pageSize: typeof PRODUCTS_PAGE_SIZE;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalPages: number;
}
