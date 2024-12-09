import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { CreateAuthReqDto } from '@/auth/dto/create-auth-req.dto';
import { GetTokenDto } from '@/kakao/login/dto/get-token.dto';
import { UserInfoDto } from '@/kakao/login/dto/user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

const createTestingApp = async <T>(modules: Type<T>[]) => {
  const moduleFixture = await Test.createTestingModule({ imports: modules }).compile();
  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  await app.init();
  return app;
};

const mockKakaoLogin = (kakaoLoginService: KakaoLoginService, id: string) => {
  const kakaoToken = {
    accessToken: 'kakaoAccessToken',
    refreshToken: 'kakaoRefreshToken',
    expiresIn: 3600,
    refreshTokenExpiresIn: 604800
  } as GetTokenDto;
  const kakaoUser = {
    id: Number(id),
    properties: {
      nickname: 'nickname',
      profileImage: 'url'
    }
  } as UserInfoDto;

  jest.spyOn(kakaoLoginService, 'login').mockResolvedValue({
    user: kakaoUser,
    token: kakaoToken
  });
};

const createUser = async (app: INestApplication, id: string) => {
  const req: CreateAuthReqDto = { code: 'testCode' };
  mockKakaoLogin(app.get(KakaoLoginService), id);
  const res = await request(app.getHttpServer()).post('/api/auth/login').send(req);
  const cookies = res.get('Set-Cookie');
  const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
  return { refreshTokenCookie };
};

const deleteUser = async (prismaService: PrismaService, id: string) => {
  await prismaService.user.delete({
    where: {
      id
    }
  });
};

export { createTestingApp, mockKakaoLogin, createUser, deleteUser };
