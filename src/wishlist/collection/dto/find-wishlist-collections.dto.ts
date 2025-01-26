import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

import { FindItemsDto } from '@/common/dto/find-items.dto';

import { SortOrder } from '@/types/collection.type';

export class FindWishlistCollectionsDto extends FindItemsDto {
  @ApiProperty({
    example: 'default is LATEST',
    enum: SortOrder,
    required: false,
    default: SortOrder.LATEST
  })
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: SortOrder = SortOrder.LATEST; // 디폴트
}
