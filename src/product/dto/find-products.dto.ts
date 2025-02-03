import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { FindItemsDto } from '@/common/dto/find-items.dto';

import { Sort } from '@/types/product.type';

export class FindProductsDto extends FindItemsDto {
  @ApiProperty({
    example: '사과'
  })
  @IsNotEmpty()
  @IsString()
  readonly query: string;

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
