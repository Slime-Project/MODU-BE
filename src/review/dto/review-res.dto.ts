import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsDate } from 'class-validator';

export class ReviewResDto {
  @ApiProperty({
    description: 'The unique identifier of the review',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  readonly id: number;

  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsNumber()
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
}
