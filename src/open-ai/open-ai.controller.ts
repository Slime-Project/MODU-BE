import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetRecommendedGiftsDto } from './dto/get-recommended-gifts-req-query-dto';
import { RecommendedGiftsResponseDto } from './dto/get-recommended-gifts-res.dto';
import { OpenAiService } from './open-ai.service';

@Controller('open-ai')
@ApiTags('open-ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @ApiOperation({
    summary: 'Get 3 recommended gifts from AI'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: RecommendedGiftsResponseDto
  })
  @Get()
  async getRecommendedGifts(@Query() getRecommendedGiftsDto: GetRecommendedGiftsDto) {
    const response = this.openAiService.getRecommendedGifts(getRecommendedGiftsDto);
    return response;
  }
}
