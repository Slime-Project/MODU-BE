import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class GetTokenDto {
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'access_token' })
  readonly accessToken: string;

  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'expires_in' })
  readonly expiresIn: number;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'refresh_token' })
  readonly refreshToken: string;

  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'refresh_token_expires_in' })
  readonly refreshTokenExpiresIn: number;
}
