import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { SearchResDto } from '@/search/dto/search-res.dto';
import { SearchDto } from '@/search/dto/search.dto';
import { SearchService } from '@/search/search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @ApiOperation({
    summary: 'Search for products and gift collections'
  })
  @ApiResponse({
    status: 200,
    description: 'Ok',
    type: SearchResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query fields'
  })
  @Get('')
  async findMany(@Query() searchDto: SearchDto) {
    const result = await this.service.findMany(searchDto);
    return plainToInstance(SearchResDto, result);
  }
}
