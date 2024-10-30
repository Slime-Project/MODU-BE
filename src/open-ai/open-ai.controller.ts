import { Controller, Get, Query } from '@nestjs/common';
import { OpenAiService } from './open-ai.service';

@Controller('open-ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Get()
  async getRecommendedGifts(
    @Query('gender') gender: string,
    @Query('age') age: string,
    @Query('relation') relation: string,
    @Query('price') price: string,
    @Query('character') character: string,
    @Query('description') description: string
  ) {
    const receiverData = `I want to give a gift to someone, and their information is below:
      gender:${gender},
      age:${age},
      our relation:${relation},
      
      I would like to give a gift that is:
      price:${price},
      gift's character:${character},
      gift's context:${description}

      Please recommend a gift for me.
      `;
    const response = this.openAiService.getRecommendedGifts(receiverData);
    return response;
  }
}
