import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { AccessTokenGuard } from './access-token.guard';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let jwtService: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    guard = module.get(AccessTokenGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when access token is valid', async () => {
      const accessToken = 'accessToken';
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: { access_token: accessToken }
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockResolvedValue({ id: 1234567890 } as never);
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when access token is missing', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: {}
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockRejectedValue(null as never);
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Access token is missing')
      );
    });

    it('should throw UnauthorizedException when access token is invalid', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: { access_token: 'invalid-token' }
          })
        })
      } as ExecutionContext;

      jwtService.verify.mockRejectedValue(null as never);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired access token')
      );
    });
  });
});
