import { Test } from '@nestjs/testing';
import { User } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '@/prisma/prisma.service';

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
      const user: User = { id: BigInt(1234567890) };

      prismaService.user.create.mockResolvedValue(user);
      const result = await userService.create(user);
      expect(result).toEqual(user);
    });
  });

  describe('findOne', () => {
    it('should return a user record if the user exists', async () => {
      const user: User = { id: BigInt(1234567890) };

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
});
