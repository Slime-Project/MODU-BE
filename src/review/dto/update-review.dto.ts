import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min
} from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4,
    required: false
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  readonly rating?: number;

  @ApiProperty({
    example: 'Great product, would recommend!',
    maxLength: 500,
    required: false
  })
  @IsString()
  @Length(0, 9)
  @IsOptional()
  readonly text?: string;

  @ApiProperty({ description: 'An array of existing URLs and new image files', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @ArrayMaxSize(9)
  @IsOptional()
  readonly imgs?: string[];
}
