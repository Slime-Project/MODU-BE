import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class PropertiesDto {
  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'nickname' })
  readonly nickname: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'profile_image' })
  readonly profileImage: string;

  @IsString()
  @IsNotEmpty()
  @Expose({ name: 'thumbnail_image' })
  readonly thumbnailImage: string;
}
