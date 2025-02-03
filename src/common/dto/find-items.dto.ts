import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class FindItemsDto {
  @ApiProperty({
    description: 'page >= 1'
  })
  @Transform(({ value }) => parseInt(value))
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  readonly page: number;
}
