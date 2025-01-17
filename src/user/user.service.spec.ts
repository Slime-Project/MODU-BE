import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockAuth } from '@/utils/unit-test';

import { UserService } from './user.service';

import { UserInfo } from '@/types/user.type';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }]
    }).compile();

    userService = module.get(UserService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user information', async () => {
      const kakaoUser: KaKaoUserInfoDto = {
        id: mockAuth.userId,
        nickname: 'nickname',
        profileImg: 'url'
      };
      const userInfo: UserInfo = {
        id: mockAuth.userId,
        role: UserRole.USER,
        nickname: kakaoUser.nickname,
        profileImg: kakaoUser.profileImg
      };

      prismaService.auth.findUnique.mockResolvedValue(mockAuth);
      KakaoLoginService.getMyInfo = jest.fn().mockResolvedValue(kakaoUser);
      const result = await userService.findOne(mockAuth.userId, mockAuth.refreshToken);
      expect(result).toEqual(userInfo);
    });

    it('should throw UnauthorizedException when refresh token is invalid or expired', () => {
      prismaService.auth.findUnique.mockResolvedValue(null);
      return expect(userService.findOne('1234567890', 'expired-token')).rejects.toThrow(
        UnauthorizedException
      );
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
