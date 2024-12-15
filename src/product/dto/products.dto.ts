import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

import { PRODUCTS_PAGE_SIZE } from '@/constants/product';
import { ProductDto } from '@/product/dto/product.dto';

export class ProductsDto {
  @ApiProperty({
    type: [ProductDto]
  })
  @Expose()
  @Type(() => ProductDto)
  @ValidateNested()
  products: ProductDto[];

  @ApiProperty({ example: 10 })
  @IsIn([PRODUCTS_PAGE_SIZE])
  @IsNotEmpty()
  @Expose()
  readonly pageSize: typeof PRODUCTS_PAGE_SIZE;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalProducts: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalPages: number;
}
