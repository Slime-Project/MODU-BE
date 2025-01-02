import { ClassSerializerInterceptor, INestApplication, Type, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { LoginDto } from '@/auth/dto/login.dto';
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

const validateDto = async (dto: ClassConstructor<object>, obj: object) => {
  const instance = plainToInstance(dto, obj);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true
  });
  expect(errors).toHaveLength(0);
};

const mockKakaoLogin = (kakaoLoginService: KakaoLoginService, id: string) => {
  const kakaoToken: GetTokenDto = {
    accessToken: 'kakaoAccessToken',
    refreshToken: 'kakaoRefreshToken',
    expiresIn: 3600,
    refreshTokenExpiresIn: 604800
  };
  const kakaoUser: KaKaoUserInfoDto = {
    id,
    nickname: 'nickname',
    profileImg: 'url'
  };

  jest.spyOn(kakaoLoginService, 'login').mockResolvedValue({
    user: kakaoUser,
    token: kakaoToken
  });

  return kakaoUser;
};

const createUser = async (app: INestApplication, id: string) => {
  const loginDto: LoginDto = { code: 'testCode' };
  const kakaoUser = mockKakaoLogin(app.get(KakaoLoginService), id);
  const res = await request(app.getHttpServer()).post('/api/auth/login').send(loginDto);
  const cookies = res.get('Set-Cookie');
  const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
  const accessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
  return { accessTokenCookie, refreshTokenCookie, kakaoUser };
};

const deleteUser = async (prismaService: PrismaService, id: string) => {
  await prismaService.user.delete({
    where: {
      id
    }
  });
};

const createProduct = async (prismaService: PrismaService, naverProductId?: string) => {
  return prismaService.product.create({
    data: {
      title: 'title',
      link: 'url',
      price: 20000,
      seller: '네이버',
      naverProductId: naverProductId || null,
      img: 'url'
    }
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
  }: { userId?: string; productId: number; rating?: number; createdAt?: Date }
) => {
  return prismaService.review.create({
    data: { userId, productId, text: '', rating: rating || 1, createdAt }
  });
};

export {
  createTestingApp,
  validateDto,
  mockKakaoLogin,
  createUser,
  deleteUser,
  createProduct,
  deleteProduct,
  createReview
};
