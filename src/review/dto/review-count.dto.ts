import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, Min, IsInt } from 'class-validator';

export class ReviewCountDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @Expose()
  readonly count: number;
}
