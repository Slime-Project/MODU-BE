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

  describe('create', () => {
    it('should return a user record', async () => {
      const user: User = { id: BigInt(1234567890), role: UserRole.USER };

      prismaService.user.create.mockResolvedValue(user);
      const result = await userService.create(user);
      expect(result).toEqual(user);
    });
  });

  describe('remove', () => {
    it('should return a user record', async () => {
      const user: User = { id: BigInt(1234567890), role: UserRole.USER };

      prismaService.user.delete.mockResolvedValue(user);
      const result = await userService.remove(user.id);
      expect(result).toEqual(user);
    });
  });

  describe('findOne', () => {
    it('should return a user record if the user exists', async () => {
      const user: User = { id: BigInt(1234567890), role: UserRole.USER };

      prismaService.user.findUnique.mockResolvedValue(user);
      const result = await userService.findOne(user.id);
      expect(result).toEqual(user);
    });

    it('should return a null if the user does not exist', async () => {
      const id = BigInt(1234567890);

      prismaService.user.findUnique.mockResolvedValue(null);
      const result = await userService.findOne(id);
      expect(result).toEqual(null);
    });
  });

  describe('deleteAccount', () => {
    it('should remove user and unlink from Kakao', async () => {
      const auth = getMockAuth();
      const user: User = { id: auth.userId, role: UserRole.USER };

      prismaService.auth.findUnique.mockResolvedValue(auth);
      KakaoLoginService.unlink = jest.fn().mockResolvedValue({ id: auth.userId });
      userService.remove = jest.fn().mockResolvedValue(user);
      await userService.deleteAccount(auth.userId, auth.refreshToken);
      expect(KakaoLoginService.unlink).toHaveBeenCalledWith(auth.kakaoAccessToken);
      expect(userService.remove).toHaveBeenCalled();
    });
  });
});
