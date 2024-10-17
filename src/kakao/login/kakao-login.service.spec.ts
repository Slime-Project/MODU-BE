import { Test, TestingModule } from '@nestjs/testing';

import { KakaoLoginService } from './kakao-login.service';

describe('KakaoLoginService', () => {
  let service: KakaoLoginService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KakaoLoginService]
    }).compile();

    service = module.get<KakaoLoginService>(KakaoLoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
