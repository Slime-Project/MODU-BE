import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CollectionBaseResDto } from '@/collection/dto/res/collection-base-res.dto';

import { WishlistCollectionCreateResDto } from './create-wishlist-collection-res.dto';

export class WishlistCollectionBaseResDto extends WishlistCollectionCreateResDto {
  @ApiProperty({ type: CollectionBaseResDto })
  @Type(() => CollectionBaseResDto)
  @ValidateNested()
  giftCollection: CollectionBaseResDto;
}
