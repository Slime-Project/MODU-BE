import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { CrawlerService } from '@/crawler/crawler.service';

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
    // Injecting ConfigService
    private readonly configService: ConfigService,

    // Injecting CrawlerService
    private readonly crawlerService: CrawlerService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY')
    });
  }

  async getRecommendedGifts(receiverData: string, min: string, max: string, tagIds: number[]) {
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: INSTRUCTION },
        { role: 'user', content: receiverData }
      ]
    });
    const recommendations = JSON.parse(await chatCompletion.choices[0].message.content);

    const promises = recommendations.map(element => {
      return this.crawlerService.getProducts(element, min, max, tagIds); // promise 반환
    });

    const results = await Promise.all(promises); // [프로미스1,프로미스2,프로미스3]

    const response = {
      gifts: results
    };

    return response;
  }
}
