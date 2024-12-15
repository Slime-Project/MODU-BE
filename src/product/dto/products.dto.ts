import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ItemsDto } from '@/common/dto/items.dto';
import { ProductDto } from '@/product/dto/product.dto';

export class ProductsDto extends ItemsDto {
  @ApiProperty({
    type: [ProductDto]
  })
  @Expose()
  @Type(() => ProductDto)
  @ValidateNested()
  products: ProductDto[];
}
