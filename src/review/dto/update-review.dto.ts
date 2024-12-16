import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  readonly rating?: number;

  @ApiProperty({
    example: 'Great product, would recommend!',
    maxLength: 500
  })
  @IsString()
  @Length(0, 500)
  @IsOptional()
  readonly text?: string;
}
