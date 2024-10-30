import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, IsIn, IsNumber } from 'class-validator';

export class ReissueTokenDto {
  @IsIn(['bearer'])
  @IsNotEmpty()
  @Expose({ name: 'token_type' })
  tokenType: 'bearer';

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'access_token' })
  accessToken: string;

  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'expires_in' })
  expiresIn: number;

  @IsString()
  @IsOptional()
  @Expose({ name: 'refresh_token' })
  refreshToken?: string;

  @IsNumber()
  @IsOptional()
  @Expose({ name: 'refresh_token_expires_in' })
  refreshTokenExpiresIn?: number;
}
