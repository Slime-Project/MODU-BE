import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { MetaDto } from '@/common/dto/meta.dto';

import { CollectionBaseResDto } from './collection-base-res.dto';

export class CollectionsResponseDto {
  @ApiProperty({
    description: 'Array of collections',
    isArray: true
  })
  @ValidateNested({ each: true })
  items: CollectionBaseResDto[];

  @ApiProperty({ type: MetaDto })
  @Type(() => MetaDto)
  @ValidateNested()
  meta: MetaDto;
}
