import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { ProfileDto } from '@/user/dto/profile.dto';

export class UserDto extends ProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890'
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  readonly id: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  @Expose()
  readonly role: UserRole;
}
