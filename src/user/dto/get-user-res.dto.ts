import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserResDto {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890'
  })
  @IsString()
  @IsNotEmpty()
  readonly id: string;

  @ApiProperty({
    description: 'profile image url'
  })
  @IsString()
  @IsNotEmpty()
  readonly profileImage: string;

  @ApiProperty({
    example: 'apple'
  })
  @IsString()
  @IsNotEmpty()
  readonly nickname: string;
}
