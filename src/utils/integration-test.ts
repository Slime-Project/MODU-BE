import { ClassSerializerInterceptor, INestApplication, Type, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { CreateAuthReqDto } from '@/auth/dto/create-auth-req.dto';
import { GetTokenDto } from '@/kakao/login/dto/get-token.dto';
import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

const createTestingApp = async <T>(modules: Type<T>[]) => {
  const moduleFixture = await Test.createTestingModule({ imports: modules }).compile();
  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true
    })
  );
  await app.init();
  return app;
};

const validateResDto = async (ResDto: ClassConstructor<object>, body: object) => {
  const dto = plainToInstance(ResDto, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true
  });
  expect(errors).toHaveLength(0);
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
  } as KaKaoUserInfoDto;

  jest.spyOn(kakaoLoginService, 'login').mockResolvedValue({
    user: kakaoUser,
    token: kakaoToken
  });

  return kakaoUser;
};

const createUser = async (app: INestApplication, id: string) => {
  const req: CreateAuthReqDto = { code: 'testCode' };
  const kakaoUser = mockKakaoLogin(app.get(KakaoLoginService), id);
  const res = await request(app.getHttpServer()).post('/api/auth/login').send(req);
  const cookies = res.get('Set-Cookie');
  const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
  return { refreshTokenCookie, kakaoUser };
};

const deleteUser = async (prismaService: PrismaService, id: string) => {
  await prismaService.user.delete({
    where: {
      id
    }
  });
};

const createProduct = async (prismaService: PrismaService) => {
  return prismaService.product.create({
    data: { title: '', link: '', price: 1, seller: '' }
  });
};

const deleteProduct = async (prismaService: PrismaService, id: number) => {
  return prismaService.product.delete({
    where: {
      id
    }
  });
};

const createReview = async (
  prismaService: PrismaService,
  {
    userId,
    productId,
    rating,
    createdAt
  }: { userId: string; productId: number; rating?: number; createdAt?: Date }
) => {
  return prismaService.review.create({
    data: { userId, productId, text: '', rating: rating || 1, createdAt }
  });
};

export {
  createTestingApp,
  validateResDto,
  mockKakaoLogin,
  createUser,
  deleteUser,
  createProduct,
  deleteProduct,
  createReview
};
