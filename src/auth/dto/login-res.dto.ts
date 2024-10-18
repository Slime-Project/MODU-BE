import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginResDto {
  @ApiProperty({
    description: 'User ID',
    example: '0123456789'
  })
  @IsString()
  @IsNotEmpty()
  readonly id: number;
}
