import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { RefreshTokenGuard } from './refresh-token.guard';

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let jwtService: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    guard = module.get(RefreshTokenGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when refresh token is valid', async () => {
      const refreshToken = 'refreshToken';
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: { refresh_token: refreshToken }
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockResolvedValue({ id: 1234567890 } as never);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: {}
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockRejectedValue(null as never);
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('You need to log in first')
      );
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: { refresh_token: 'invalid-token' }
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockRejectedValue(null as never);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token')
      );
    });
  });
});
