import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class LoginResDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsOptional()
  picture?: string;
}
