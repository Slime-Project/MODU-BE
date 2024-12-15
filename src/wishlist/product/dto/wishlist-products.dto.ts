import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ItemsDto } from '@/common/dto/items.dto';
import { WishlistProductDto } from '@/wishlist/product/dto/wishlist-product.dto';

export class WishlistProductsDto extends ItemsDto {
  @ApiProperty({
    type: [WishlistProductDto]
  })
  @Expose()
  @Type(() => WishlistProductDto)
  @ValidateNested()
  products: WishlistProductDto[];
}
