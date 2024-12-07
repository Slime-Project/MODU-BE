import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { getMockAuth } from '@/utils/unit-test';

import { UserService } from './user.service';

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

  describe('deleteAccount', () => {
    it('should remove user and unlink from Kakao', async () => {
      const auth = getMockAuth();
      const user: User = { id: auth.userId, role: UserRole.USER };

      prismaService.auth.findUnique.mockResolvedValue(auth);
      KakaoLoginService.unlink = jest.fn().mockResolvedValue({ id: auth.userId });
      prismaService.user.delete.mockResolvedValue(user);
      await userService.deleteAccount(auth.userId, auth.refreshToken);
      expect(KakaoLoginService.unlink).toHaveBeenCalledWith(auth.kakaoAccessToken);
      expect(prismaService.user.delete).toHaveBeenCalled();
    });
  });
});
