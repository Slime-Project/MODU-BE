import {
  Controller,
  Get,
  Query,
  RequestTimeoutException,
  UnauthorizedException
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { GetRecommendedGiftsDto } from './dto/get-recommended-gifts-req-query-dto';
import { OpenAiService } from './open-ai.service';

@Controller('open-ai')
export class OpenAiController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly prismaService: PrismaService
  ) {}

  @Get()
  async getRecommendedGifts(@Query() query: GetRecommendedGiftsDto) {
    const { gender, age, range, relation, min, max, character, description } = query;
    const tagIds: number[] = [];

    // 태그 id 조회 함수, 추후 따로 빼줘야할수도
    const getTagIdByName = async (tagName: string) => {
      const tag = await this.prismaService.tag.findUnique({
        where: { name: tagName }
      });
      return tag ? tag.id : null;
    };

    // gender, age, relation, character 태그 ID 조회
    const tagNames = [gender, age, relation, character];

    tagNames.forEach(async tag => {
      try {
        const tagId = await getTagIdByName(tag);
        if (!tagId) {
          throw new UnauthorizedException('Tag does not exist');
        }
        tagIds.push(tagId);
      } catch (error) {
        throw new RequestTimeoutException('db 연동 오류');
      }
    });

    const receiverData = `I want to give a gift to someone, and their information is below:
      gender:${gender},
      age:${age + range},
      our relation:${relation},
      
      I would like to give a gift that is:
      minimal price:${min} won,
      maximum price:${max} won,
      gift's character:${character},
      gift's context:${description}

      Please recommend 3 gifts for me.
      `;
    const response = this.openAiService.getRecommendedGifts(receiverData, min, max, tagIds);
    return response;
  }
}
