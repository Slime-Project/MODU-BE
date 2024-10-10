import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class LoginReqDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  picture: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  test?: number;
}
