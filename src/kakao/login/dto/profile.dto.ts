import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class ProfileDto {
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'nickname' })
  readonly nickname: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'profile_image_url' })
  readonly profileImageUrl: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'thumbnail_image_url' })
  readonly thumbnailImageUrl: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'is_default_image' })
  readonly isDefaultImage: boolean;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'is_default_nickname' })
  readonly isDefaultNickname: boolean;
}
