import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsInt,
  Min,
  Max,
  ValidateIf,
  IsArray,
  ArrayMaxSize
} from 'class-validator';

export class ReviewDto {
  @ApiProperty({
    description: 'The unique identifier of the review',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Expose()
  readonly id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Expose()
  productId: number;

  @ApiProperty()
  @ValidateIf(o => o.userId !== null)
  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string | null;

  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @Expose()
  readonly rating: number;

  @ApiProperty({
    example: 'Great product, would recommend!'
  })
  @IsString()
  @Expose()
  readonly text: string;

  @ApiProperty({
    example: '2024-12-09T02:18:34.615Z'
  })
  @IsDate()
  @IsNotEmpty()
  @Expose()
  @Type(() => Date)
  readonly createdAt: Date;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMaxSize(9)
  @Expose()
  readonly imgs: string[];
}
