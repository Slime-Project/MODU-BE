import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { MetaDto } from '@/common/dto/meta.dto';

export class PaginationResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true
  })
  @ValidateNested({ each: true })
  items: T[];

  @ApiProperty({ type: MetaDto })
  @Type(() => MetaDto)
  @ValidateNested()
  meta: MetaDto;
}
