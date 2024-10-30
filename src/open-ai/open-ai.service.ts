import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const INSTRUCTION = `
You are an AI that recommends gifts. The client wants to receive gift recommendations. 
The client will provide you with information about the person who will receive the gift. Sometimes the client may also let you know what kind of gift they want to give that person. 
Based on the information you receive, you should return 5 gift keywords in an array format. The elements inside the array should be in Korean.

If the person receiving the gift is a woman in her mid-twenties and wants a birthday gift recommendation, 
a good answer example would be: ["조명 스탠드", "인테리어 화분", "책상 정리함", "벽걸이 아트워크", "디퓨저"].
Elements of array SHOULD NOT CONTAIN adjectives.
Please return only array.
`;

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY')
    });
  }

  async getRecommendedGifts(receiverData: string) {
    const chatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: INSTRUCTION },
        { role: 'user', content: receiverData }
      ]
    });
    return chatCompletion.choices[0].message.content;
  }
}
