import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayMaxSize, IsString } from 'class-validator';

import { CollectionBaseResDto } from './collection-base-res.dto';

import { ProductThumbnailData } from '@/types/product.type';

export class CollectionDetailResDto extends CollectionBaseResDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        img: { type: 'string' },
        title: { type: 'string' },
        price: { type: 'number' },
        seller: { type: 'string' }
      }
    }
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(10)
  products: ProductThumbnailData[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(10)
  tags: string[];
}
