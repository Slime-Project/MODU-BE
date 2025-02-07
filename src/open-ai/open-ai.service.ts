import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { CrawlerService } from '@/crawler/crawler.service';
import { TagService } from '@/tag/tag.service';

import { GetRecommendedGiftsDto } from './dto/get-recommended-gifts-req-query-dto';
import { RecommendedGiftsResponseDto } from './dto/get-recommended-gifts-res.dto';

import { Gender, Relation } from '@/types/open-ai.type';

const INSTRUCTION = `
You are an AI that recommends gifts. The client wants to receive gift recommendations. 
The client will provide you with information about the person who will receive the gift. Sometimes the client may also let you know what kind of gift they want to give that person. 
Based on the information you receive, you should return 3 gift keywords in an array format. The elements inside the array should be in Korean. Please recommend general gift items.
Provide natural nouns, not specific brands or combinations.

If the person receiving the gift is a woman in her mid-twenties and wants a birthday gift recommendation, 
a good answer example would be: ["조명 스탠드", "여자 향수", "디퓨저"].
Elements of array SHOULD NOT CONTAIN adjectives.
Please return only Array, not string
`;

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly crawlerService: CrawlerService,
    private readonly tagService: TagService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY')
    });
  }

  async getRecommendedGifts(
    getRecommendedGiftsDto: GetRecommendedGiftsDto
  ): Promise<RecommendedGiftsResponseDto> {
    const { gender, age, range, relation, min, max, character, description } =
      getRecommendedGiftsDto;

    // gender, age, relation, character 태그 ID 조회
    const tagNames: string[] = [character];

    const isEnumRelation = Object.values(Relation).includes(relation as Relation);

    if (isEnumRelation) {
      // '기타'를 선택해서 enum 아닌 값들은 태그저장X
      tagNames.push(relation);
    }

    if (gender !== Gender.ETC) {
      tagNames.push(`${age} ${gender}`);
    }

    const tagIds: number[] = await this.tagService.getTagsId(tagNames);

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

    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: INSTRUCTION },
        { role: 'user', content: receiverData }
      ]
    });
    const recommendations = JSON.parse(await chatCompletion.choices[0].message.content);

    const results = await Promise.all(
      recommendations.map(product => {
        return this.crawlerService.getProducts(product, min, max, tagIds); // promise 반환
      })
    ); // [프로미스1,프로미스2,프로미스3]

    return { tags: tagNames, gifts: results };
  }
}
