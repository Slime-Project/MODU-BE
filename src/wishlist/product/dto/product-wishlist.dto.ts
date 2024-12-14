import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ProductDto } from '@/product/dto/product.dto';

export class ProductWishlistDto {
  @ApiProperty({
    type: [ProductDto]
  })
  @IsNotEmpty()
  @Expose()
  @Type(() => ProductDto)
  @ValidateNested()
  product: ProductDto[];
}
