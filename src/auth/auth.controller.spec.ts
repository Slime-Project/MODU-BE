import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { AuthService } from '@/auth/auth.service';
import { CreateAuthReqDto } from '@/auth/dto/create-auth-req.dto';
import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';

import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let service: DeepMockProxy<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockDeep<AuthService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should set cookies', async () => {
      const code = 'test-code';
      const user = { id: BigInt(1234567890) };
      const token = {
        accessToken: 'mockAccessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'mockRefreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };
      const res = {
        cookie: jest.fn()
      } as unknown as Response;

      service.create.mockResolvedValue({ user, token });
      await controller.create(reqBody, res);
      expect(res.cookie).toHaveBeenCalledWith('access_token', token.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.exp
      });
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', token.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.refreshTokenExp
      });
    });

    it('should return the body with user', async () => {
      const code = 'test-code';
      const user = { id: BigInt(1234567890) };
      const token = {
        accessToken: 'accessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };
      const res = {
        cookie: jest.fn()
      } as unknown as Response;
      const resBody = { id: Number(user.id) };

      service.create.mockResolvedValue({ user, token });
      const result: CreateAuthResDto = await controller.create(reqBody, res);
      expect(result).toEqual(resBody);
    });
  });
});
