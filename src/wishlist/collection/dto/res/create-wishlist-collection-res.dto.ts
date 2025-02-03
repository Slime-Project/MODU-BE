import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString, IsDate } from 'class-validator';

export class WishlistCollectionCreateResDto {
  @ApiProperty({ description: 'Id of wishlistCollection', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    example: '2024-12-09T02:18:34.615Z'
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ example: 201 })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: null })
  productId: number | null;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  giftCollectionId: number;
}
