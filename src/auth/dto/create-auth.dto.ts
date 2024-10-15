import { IsString, IsInt, IsNotEmpty, IsDate } from 'class-validator';

export class CreateAuthDto {
  @IsInt()
  @IsNotEmpty()
  readonly userId: bigint;

  @IsString()
  @IsNotEmpty()
  readonly refreshToken: string;

  @IsDate()
  @IsNotEmpty()
  readonly refreshTokenExp: Date;

  @IsString()
  @IsNotEmpty()
  readonly kakaoAccessToken: string;

  @IsString()
  @IsNotEmpty()
  readonly kakaoRefreshToken: string;
}
