import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly id: string;

  @ApiProperty({
    description: 'profile image url'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly profileImage: string;

  @ApiProperty({
    example: 'apple'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly nickname: string;
}
