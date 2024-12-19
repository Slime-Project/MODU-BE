import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class KaKaoUserInfoDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose({ name: 'id' })
  @Transform(({ value }) => value.toString())
  readonly id: string;

  @IsNotEmpty()
  @Transform(({ obj }) => obj.kakao_account.profile.nickname)
  @Expose()
  readonly nickname: string;

  @IsNotEmpty()
  @Transform(({ obj }) => obj.kakao_account.profile.profile_image_url)
  @Expose()
  readonly profileImg: string;
}
