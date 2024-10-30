import { IsString, IsOptional, IsDate, IsNotEmpty } from 'class-validator';

export class UpdateAuthDto {
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;

  @IsDate()
  @IsOptional()
  refreshTokenExp?: Date;

  @IsString()
  @IsNotEmpty()
  kakaoAccessToken: string;

  @IsString()
  @IsNotEmpty()
  kakaoRefreshToken?: string;
}
