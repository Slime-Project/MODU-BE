import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, Length, IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
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
