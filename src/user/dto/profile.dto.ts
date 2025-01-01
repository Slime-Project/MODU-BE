import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProfileDto {
  @ApiProperty({
    description: 'profile image url'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly profileImg: string;

  @ApiProperty({
    example: 'apple'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly nickname: string;
}
