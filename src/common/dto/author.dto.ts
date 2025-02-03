import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class AuthorDto {
  @ApiProperty({ description: 'The unique identifier of the user(author)' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  profileImg: string;
}
