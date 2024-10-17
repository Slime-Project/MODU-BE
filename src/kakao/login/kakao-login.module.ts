import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KakaoLoginService } from './kakao-login.service';

@Module({
  imports: [ConfigModule],
  providers: [KakaoLoginService],
  exports: [KakaoLoginService]
})
export class KakaoLoginModule {}
