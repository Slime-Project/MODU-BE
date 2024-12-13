import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchDto {
  @ApiProperty({
    example: '사과'
  })
  @IsNotEmpty()
  @IsString()
  readonly query: string;
}
