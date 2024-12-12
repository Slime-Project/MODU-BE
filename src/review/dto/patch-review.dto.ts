import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNumber, ValidateIf } from 'class-validator';

export class PatchReviewDto {
  @ApiProperty({
    description: 'The rating score for the product, typically between 1 and 5',
    example: 4
  })
  @IsNumber()
  @ValidateIf(o => o.text === undefined)
  readonly rating?: number;

  @ApiProperty({
    example: 'Great product, would recommend!',
    maxLength: 500
  })
  @IsString()
  @Length(0, 500)
  @ValidateIf(o => o.rating === undefined)
  readonly text?: string;
}
