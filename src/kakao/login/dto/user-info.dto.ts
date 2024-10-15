import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsDate, ValidateNested } from 'class-validator';

import { KakaoAccountDto } from '@/kakao/login/dto/kakao-account.dto';
import { PropertiesDto } from '@/kakao/login/dto/properties.dto';

export class UserInfoDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'id' })
  readonly id: bigint;

  @IsDate()
  @IsNotEmpty()
  @Expose({ name: 'connected_at' })
  readonly connectedAt: Date;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PropertiesDto)
  @Expose({ name: 'properties' })
  readonly properties: PropertiesDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PropertiesDto)
  @Expose({ name: 'kakao_account' })
  readonly kakaoAccount: KakaoAccountDto;
}
