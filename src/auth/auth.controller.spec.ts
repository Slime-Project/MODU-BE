import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { AuthService } from '@/auth/auth.service';
import { CreateAuthReqDto } from '@/auth/dto/create-auth-req.dto';
import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';

import { AuthController } from './auth.controller';

import { ReissuedToken, ReissueTokenReq } from '@/types/auth.type';

describe('AuthController', () => {
  let controller: AuthController;
  let service: DeepMockProxy<AuthService>;
  let response: DeepMockProxy<Response>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockDeep<AuthService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
    response = mockDeep<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should set cookies', async () => {
      const code = 'test-code';
      const user = { id: BigInt(1234567890), role: UserRole.USER };
      const token = {
        accessToken: 'accessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };
      const resBody: CreateAuthResDto = { id: Number(user.id) };

      service.create.mockResolvedValue({ user: resBody, token });
      await controller.create(reqBody, response);
      expect(response.cookie).toHaveBeenCalledWith('access_token', token.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.exp
      });
      expect(response.cookie).toHaveBeenCalledWith('refresh_token', token.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.refreshTokenExp
      });
    });

    it('should return the body with user', async () => {
      const code = 'test-code';
      const user = { id: BigInt(1234567890), role: UserRole.USER };
      const token = {
        accessToken: 'accessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };
      const resBody: CreateAuthResDto = { id: Number(user.id) };

      service.create.mockResolvedValue({ user: resBody, token });
      const result: CreateAuthResDto = await controller.create(reqBody, response);
      expect(result).toEqual(resBody);
    });
  });

  describe('reissueToken', () => {
    it('should set cookies', async () => {
      const token: ReissuedToken = {
        accessToken: 'newAccessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'newRefreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const req = {
        id: 1234567890
      } as ReissueTokenReq;
      req.cookies = {
        refresh_token: 'refreshToken'
      };

      service.reissueToken.mockResolvedValue(token);
      await controller.reissueToken(req, response);
      expect(response.cookie).toHaveBeenCalledWith('access_token', token.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.exp
      });
      expect(response.cookie).toHaveBeenCalledWith('refresh_token', token.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: token.refreshTokenExp
      });
    });
  });
});
