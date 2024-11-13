import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateAuthResDto {
  @ApiProperty({
    description: 'User ID',
    example: 1234567890
  })
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;
}
