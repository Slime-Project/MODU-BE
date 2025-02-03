import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class CollectionCreateResDto {
  @ApiProperty({ description: 'Id of collection', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 201 })
  @IsNotEmpty()
  @IsInt()
  status: number;
}
