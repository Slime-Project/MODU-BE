import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserService } from '@/user/user.service';

import { UserController } from './user.controller';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

describe('UserController', () => {
  let controller: UserController;
  let response: DeepMockProxy<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
        { provide: UserService, useValue: mockDeep<UserService>() }
      ]
    }).compile();

    controller = module.get<UserController>(UserController);
    response = mockDeep<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deleteAccount', () => {
    it('should clear cookies', async () => {
      const refreshToken = 'refreshToken';
      const req = {
        id: '1234567890'
      } as RefreshTokenGuardReq;
      req.cookies = {
        refresh_token: refreshToken
      };
      await controller.deleteAccount(req, response);
      expect(response.cookie).toHaveBeenCalledWith('access_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: new Date(0)
      });
      expect(response.cookie).toHaveBeenCalledWith('refresh_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: new Date(0)
      });
    });
  });
});
