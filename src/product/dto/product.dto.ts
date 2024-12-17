import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ProductDto {
  @ApiProperty({
    description: 'Product Id'
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Expose()
  readonly id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly title: string;

  @ApiProperty({
    description: 'Product image URL'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly img: string;

  @ApiProperty({
    description: 'Product sales page URL'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly link: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Expose()
  readonly price: number;

  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly seller: string;

  @IsDate()
  @IsNotEmpty()
  @Expose()
  @Type(() => Date)
  readonly createdAt: Date;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @Expose()
  readonly likedCount: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @Expose()
  readonly averageRating: number;
}
