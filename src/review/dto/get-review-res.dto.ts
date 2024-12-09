import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDate } from 'class-validator';

export class GetReviewResDto {
  @ApiProperty({
    description: 'The unique identifier of the review',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsNumber()
  @IsNotEmpty()
  readonly rating: number;

  @ApiProperty({
    example: 'Great product, would recommend!'
  })
  @IsString()
  @IsNotEmpty()
  readonly text: string;

  @ApiProperty({
    example: '2024-12-09T02:18:34.615Z'
  })
  @IsDate()
  @IsNotEmpty()
  readonly createdAt: Date;
}
