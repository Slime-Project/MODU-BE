import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UserDto } from '@/user/dto/user.dto';
import { UserService } from '@/user/user.service';

import { UserController } from './user.controller';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';
import { UserInfo } from '@/types/user.type';

describe('UserController', () => {
  let controller: UserController;
  let service: DeepMockProxy<UserService>;
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

    controller = module.get(UserController);
    service = module.get(UserService);
    response = mockDeep<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an instance of UserDto', async () => {
      const req = {
        id: '1234567890'
      } as TokenGuardReq;
      req.cookies = {
        refresh_token: 'refreshToken'
      };
      const userInfo: UserInfo = {
        id: req.id,
        nickname: 'nickname',
        profileImg: 'url'
      };
      service.findOne.mockResolvedValue(userInfo);
      const result = await controller.findOne(req);
      expect(result).toBeInstanceOf(UserDto);
    });
  });

  describe('remove', () => {
    it('should clear cookies', async () => {
      const refreshToken = 'refreshToken';
      const req = {
        id: '1234567890'
      } as TokenGuardReq;
      req.cookies = {
        refresh_token: refreshToken
      };
      await controller.remove(req, response);
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
