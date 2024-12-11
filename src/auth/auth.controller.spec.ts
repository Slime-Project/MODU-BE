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

import { ReissuedToken } from '@/types/auth.type';
import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

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

  describe('login', () => {
    it('should set cookies', async () => {
      const code = 'test-code';
      const user = { id: '1234567890', role: UserRole.USER };
      const token = {
        accessToken: 'accessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };

      service.login.mockResolvedValue({ user, token });
      await controller.login(reqBody, response);
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

    it('should return an instance of CreateAuthResDto', async () => {
      const code = 'test-code';
      const user = { id: '1234567890', role: UserRole.USER };
      const token = {
        accessToken: 'accessToken',
        exp: new Date(Date.now() + 3600000),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() + 604800000)
      };
      const reqBody: CreateAuthReqDto = { code };

      service.login.mockResolvedValue({ user, token });
      const result = await controller.login(reqBody, response);
      expect(result).toBeInstanceOf(CreateAuthResDto);
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
        id: '1234567890'
      } as RefreshTokenGuardReq;
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

  describe('logout', () => {
    it('should clear cookies', async () => {
      const refreshToken = 'refreshToken';
      const req = {
        id: '1234567890'
      } as RefreshTokenGuardReq;
      req.cookies = {
        refresh_token: refreshToken
      };
      await controller.logout(req, response);
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
