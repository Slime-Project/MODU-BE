import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested, IsBoolean } from 'class-validator';

import { ProfileDto } from '@/kakao/login/dto/profile.dto';

export class KakaoAccountDto {
  @IsBoolean()
  @IsNotEmpty()
  @Expose({ name: 'profile_nickname_needs_agreement' })
  readonly profileNicknameNeedsAgreement: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @Expose({ name: 'profile_image_needs_agreement' })
  readonly profileImageNeedsAgreement: boolean;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProfileDto)
  @Expose({ name: 'profile' })
  readonly profile: ProfileDto;
}
