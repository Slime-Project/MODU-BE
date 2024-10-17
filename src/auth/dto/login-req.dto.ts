import { IsString, IsNotEmpty } from 'class-validator';

export class LoginReqDto {
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}
