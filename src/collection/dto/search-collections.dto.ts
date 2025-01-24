import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { FindCollectionsDto } from './find-collections.dto';

export class SearchCollectionsDto extends FindCollectionsDto {
  @ApiProperty({
    description: 'keyword searched by user'
  })
  @IsNotEmpty()
  @IsString()
  readonly keyword: string;
}
