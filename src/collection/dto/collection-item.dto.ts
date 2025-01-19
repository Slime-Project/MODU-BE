import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsInt,
  IsArray,
  ArrayMaxSize,
  IsUrl,
  ValidateNested
} from 'class-validator';

import { AuthorDto } from '@/common/dto/author.dto';

export class CollectionItemDto {
  @ApiProperty({
    description: 'The unique identifier of the giftCollection',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(9)
  @IsNotEmpty()
  productsId: number[];

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(9)
  @IsNotEmpty()
  tagsId: number[];

  @ApiProperty({
    example: '10 gifts for teenager girl'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'must be s3 URL '
  })
  @IsUrl()
  img: string;

  @ApiProperty({
    example: '2024-12-09T02:18:34.615Z'
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  readonly createdAt: Date;

  @ApiProperty({
    example: '2024-12-09T02:18:34.615Z'
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  readonly updatedAt: Date;

  @ApiProperty({
    description: 'The number of wished by users',
    example: 0
  })
  @IsInt()
  @IsNotEmpty()
  readonly wishedCount: number;

  @ApiProperty({ type: AuthorDto })
  @Type(() => AuthorDto)
  @ValidateNested()
  author: AuthorDto;
}
