import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested, IsNumber } from 'class-validator';

import { PropertiesDto } from '@/kakao/login/dto/properties.dto';

export class KaKaoUserInfoDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'id' })
  readonly id: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PropertiesDto)
  @Expose({ name: 'properties' })
  readonly properties: PropertiesDto;
}
