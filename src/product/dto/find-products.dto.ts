import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { Sort } from '@/types/product.type';

export class FindProductsDto {
  @ApiProperty({
    example: '사과'
  })
  @IsNotEmpty()
  @IsString()
  readonly query: string;

  @ApiProperty({
    description: 'Must be an integer greater than or equal to 1',
    example: 1
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  readonly page: number;

  @ApiProperty({
    description: 'If not provided, defaults to "sim"',
    example: 'sim',
    enum: ['sim', 'date', 'asc', 'dsc'],
    required: false
  })
  @IsOptional()
  @IsIn(['sim', 'date', 'asc', 'dsc'], { message: 'sortBy must be either rating or createdAt' })
  readonly sort?: Sort;
}
