import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ItemsDto {
  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Expose()
  readonly pageSize: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  total: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalPages: number;
}
