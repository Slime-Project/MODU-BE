import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CrawledItemResDto } from '@/crawler/dto/crawled-item-res.dto';

export class RecommendedGiftsResponseDto {
  @ApiProperty({
    description: 'Tags of gifts'
  })
  @IsArray()
  tags: string[];

  @ApiProperty({ type: CrawledItemResDto })
  @Type(() => CrawledItemResDto)
  @ValidateNested()
  gifts: CrawledItemResDto[];
}
