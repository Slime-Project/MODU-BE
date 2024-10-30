import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAiService } from './open-ai.service';
import { OpenAiController } from './open-ai.controller';

@Module({
  imports: [ConfigModule],
  providers: [OpenAiService],
  controllers: [OpenAiController]
})
export class OpenAiModule {}
