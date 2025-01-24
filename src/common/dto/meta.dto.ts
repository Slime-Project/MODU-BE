import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class MetaDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  currentPage: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  hasMore: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  totalItems: number;
}
