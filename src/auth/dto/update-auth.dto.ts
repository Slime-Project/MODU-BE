import { IsString, IsOptional, IsDate } from 'class-validator';

export class UpdateAuthDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsDate()
  @IsOptional()
  refreshTokenExp?: Date;

  @IsString()
  @IsOptional()
  kakaoAccessToken?: string;

  @IsString()
  @IsOptional()
  kakaoRefreshToken?: string;
}
