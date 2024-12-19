import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { getMockAuth } from '@/utils/unit-test';

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
      const auth = getMockAuth();
      const kakaoUser: KaKaoUserInfoDto = {
        id: Number(auth.id),
        properties: {
          nickname: 'nickname',
          profileImage: 'url'
        }
      };
      const userInfo: UserInfo = {
        id: auth.userId,
        nickname: kakaoUser.properties.nickname,
        profileImage: kakaoUser.properties.profileImage
      };

      prismaService.auth.findUnique.mockResolvedValue(auth);
      KakaoLoginService.getUserInfo = jest.fn().mockResolvedValue(kakaoUser);
      const result = await userService.findOne(auth.userId, auth.refreshToken);
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
      const auth = getMockAuth();
      const user: User = { id: auth.userId, role: UserRole.USER };

      prismaService.auth.findUnique.mockResolvedValue(auth);
      KakaoLoginService.unlink = jest.fn();
      prismaService.$transaction.mockResolvedValue(user);
      await userService.remove(auth.userId, auth.refreshToken);
      expect(KakaoLoginService.unlink).toHaveBeenCalledWith(auth.kakaoAccessToken);
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
