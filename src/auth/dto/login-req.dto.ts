import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginReqDto {
  @ApiProperty({
    description: 'The authorization code included in the redirect URI',
    example:
      'Ah2B5NOVbum5IoWxQ15z-IDIRtwS_Qt8tAFoA2W2f6Fr1FLeCPt1YQAAAAQKPXNOAAABkpMRgcKBPKUF0hG4dQ'
  })
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}
