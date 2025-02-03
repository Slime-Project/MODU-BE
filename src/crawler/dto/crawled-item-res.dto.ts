import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@prisma/client';
import { IsArray, IsString } from 'class-validator';

export class CrawledItemResDto {
  @ApiProperty({
    description: 'Name of gift'
  })
  @IsString()
  keyword: string;

  @ApiProperty({
    description: 'list of products',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        img: { type: 'string' },
        title: { type: 'string' },
        link: { type: 'string' },
        price: { type: 'number' },
        seller: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        wishedCount: { type: 'number' },
        naverProductId: { type: 'string', nullable: true },
        averageRating: { type: 'number' }
      }
    }
  })
  @IsArray()
  items: Product[];
}
