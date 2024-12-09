import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';

export class CreateReviewReqDto {
  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsNumber()
  @IsNotEmpty()
  readonly rating: number;

  @ApiProperty({
    example: 'Great product, would recommend!',
    maxLength: 500
  })
  @IsString()
  @Length(0, 500)
  readonly text: string;
}
