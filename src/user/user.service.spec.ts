import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { kakaoUserInfoDtoMock, mockAuth, userInfoMock, userMock } from '@/utils/unit-test';

import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: DeepMockProxy<PrismaService>;
  let kakaoLoginService: DeepMockProxy<KakaoLoginService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: KakaoLoginService, useValue: mockDeep<KakaoLoginService>() }
      ]
    }).compile();

    userService = module.get(UserService);
    prismaService = module.get(PrismaService);
    kakaoLoginService = module.get(KakaoLoginService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user information', async () => {
      prismaService.user.findUnique.mockResolvedValue(userMock);
      kakaoLoginService.getUserInfo.mockResolvedValue(kakaoUserInfoDtoMock);
      const result = await userService.findOne(userMock.id);
      expect(result).toEqual(userInfoMock);
    });
  });

  describe('findMany', () => {
    it('should return users information', async () => {
      prismaService.user.findMany.mockResolvedValue([userMock]);
      kakaoLoginService.findUsers.mockResolvedValue([kakaoUserInfoDtoMock]);
      const result = await userService.findMany([userMock.id]);
      expect(result).toEqual([userInfoMock]);
    });
  });

  describe('remove', () => {
    it('should remove user and unlink from Kakao', async () => {
      const user: User = { id: mockAuth.userId, role: UserRole.USER };

      prismaService.auth.findUnique.mockResolvedValue(mockAuth);
      KakaoLoginService.unlink = jest.fn();
      prismaService.$transaction.mockResolvedValue(user);
      await userService.remove(mockAuth.userId, mockAuth.refreshToken);
      expect(KakaoLoginService.unlink).toHaveBeenCalledWith(mockAuth.kakaoAccessToken);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is invalid or expired', () => {
      prismaService.auth.findUnique.mockResolvedValue(null);
      return expect(userService.remove('1234567890', 'expired-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
