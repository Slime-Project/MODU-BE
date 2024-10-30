import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Auth, User } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { UpdateAuthDto } from '@/auth/dto/update-auth.dto';
import { GetTokenDto } from '@/kakao/login/dto/get-token.dto';
import { ReissueTokenDto } from '@/kakao/login/dto/reissue-token.dto';
import { UserInfoDto } from '@/kakao/login/dto/user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

import { AuthService } from './auth.service';

import {
  AccessTokenInfo,
  CreateAuth,
  RefreshTokenInfo,
  ReissuedToken,
  TokensInfo
} from '@/types/auth.type';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: DeepMockProxy<UserService>;
  let kakaoLoginService: DeepMockProxy<KakaoLoginService>;
  let prismaService: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockDeep<UserService>() },
        { provide: KakaoLoginService, useValue: mockDeep<KakaoLoginService>() },
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    kakaoLoginService = module.get(KakaoLoginService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('create', () => {
    it('should return a user and an auth record if the user already exists', async () => {
      const kakaoToken = {
        accessToken: 'kakaoAccessToken',
        refreshToken: 'kakaoRefreshToken',
        expiresIn: 3600,
        refreshTokenExpiresIn: 604800
      } as GetTokenDto;
      const kakaoUser = {
        id: 1234567890,
        properties: {
          nickname: 'nickname',
          profileImage: 'url'
        }
      } as UserInfoDto;
      const user: User = { id: BigInt(kakaoUser.id) };
      const refreshExpMillis = AuthService.convertSecondsToMillis(kakaoToken.refreshTokenExpiresIn);
      const expMillis = AuthService.convertSecondsToMillis(kakaoToken.expiresIn);
      const accessTokenInfo: AccessTokenInfo = {
        accessToken: 'accessToken',
        exp: AuthService.getExpDate(expMillis)
      };
      const refreshTokenInfo: RefreshTokenInfo = {
        refreshToken: 'refreshToken',
        refreshTokenExp: AuthService.getExpDate(refreshExpMillis)
      };
      const tokensInfo: TokensInfo = {
        ...accessTokenInfo,
        ...refreshTokenInfo
      };
      const createAuth: CreateAuth = {
        userId: user.id,
        ...refreshTokenInfo,
        kakaoAccessToken: kakaoToken.accessToken,
        kakaoRefreshToken: kakaoToken.refreshToken
      };
      const auth: Auth = {
        id: 1,
        ...createAuth
      };

      kakaoLoginService.login.mockResolvedValue({
        user: kakaoUser,
        token: kakaoToken
      });
      authService.createAccessToken = jest.fn().mockResolvedValue(accessTokenInfo);
      authService.createRefreshToken = jest.fn().mockResolvedValue(refreshTokenInfo);
      userService.findOne.mockResolvedValue(user);
      prismaService.auth.create.mockResolvedValue(auth);
      const result = await authService.create('mockCode');
      expect(result).toEqual({
        user,
        token: tokensInfo
      });
    });

    it('should return a user and an auth record if the user is new', async () => {
      const kakaoToken = {
        accessToken: 'kakaoAccessToken',
        refreshToken: 'kakaoRefreshToken',
        expiresIn: 3600,
        refreshTokenExpiresIn: 604800
      } as GetTokenDto;
      const kakaoUser = {
        id: 1234567890,
        properties: {
          nickname: 'nickname',
          profileImage: 'url'
        }
      } as UserInfoDto;
      const user = { id: kakaoUser.id };
      const refreshExpMillis = AuthService.convertSecondsToMillis(kakaoToken.refreshTokenExpiresIn);
      const expMillis = AuthService.convertSecondsToMillis(kakaoToken.expiresIn);
      const accessTokenInfo: AccessTokenInfo = {
        accessToken: 'accessToken',
        exp: AuthService.getExpDate(expMillis)
      };
      const refreshTokenInfo: RefreshTokenInfo = {
        refreshToken: 'refreshToken',
        refreshTokenExp: AuthService.getExpDate(refreshExpMillis)
      };
      const tokensInfo: TokensInfo = {
        ...accessTokenInfo,
        ...refreshTokenInfo
      };

      kakaoLoginService.login.mockResolvedValue({
        user: kakaoUser,
        token: kakaoToken
      });
      authService.createAccessToken = jest.fn().mockResolvedValue(accessTokenInfo);
      authService.createRefreshToken = jest.fn().mockResolvedValue(refreshTokenInfo);
      userService.findOne.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(user);
      const result = await authService.create('mockCode');
      expect(result).toEqual({
        user,
        token: tokensInfo
      });
    });
  });

  describe('update', () => {
    it('should return an auth record', async () => {
      const auth: Auth = {
        id: 1,
        userId: BigInt(1234567890),
        refreshToken: 'refreshToken',
        refreshTokenExp: AuthService.getExpDate(604800000),
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken'
      };
      const updateAuthDto: UpdateAuthDto = {
        refreshToken: 'newRefreshToken',
        refreshTokenExp: AuthService.getExpDate(604800000),
        kakaoAccessToken: 'newKakaoAccessToken',
        kakaoRefreshToken: 'newKakaoRefreshToken'
      };

      prismaService.auth.update.mockResolvedValue({ ...auth, ...updateAuthDto });
      const result = await authService.update(auth.id, updateAuthDto);
      expect(result).toEqual({ ...auth, ...updateAuthDto });
    });
  });

  describe('remove', () => {
    it('should return an auth record', async () => {
      const auth: Auth = {
        id: 1,
        userId: BigInt(1234567890),
        refreshToken: 'refreshToken',
        refreshTokenExp: AuthService.getExpDate(604800000),
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken'
      };

      prismaService.auth.delete.mockResolvedValue(auth);
      const result = await authService.remove(auth.id);
      expect(result).toEqual(auth);
    });
  });

  describe('findOne', () => {
    it('should return an auth record', async () => {
      const auth: Auth = {
        id: 1,
        userId: BigInt(1234567890),
        refreshToken: 'refreshToken',
        refreshTokenExp: AuthService.getExpDate(604800000),
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken'
      };

      prismaService.auth.findUnique.mockResolvedValue(auth);
      const result = await authService.findOne(auth.userId, auth.refreshToken);
      expect(result).toEqual(auth);
    });
  });

  describe('createAccessToken', () => {
    it('should return an object of type AccessTokenInfo', async () => {
      const userId = BigInt(1234567890);
      const expSec = 3600000;
      const accessToken = 'accessToken';

      jwtService.signAsync.mockResolvedValue(accessToken);
      const result = await authService.createAccessToken(Number(userId), expSec);
      expect(result).toEqual({
        accessToken,
        exp: expect.any(Date)
      });
    });
  });

  describe('createRefreshToken', () => {
    it('should return an object of type RefreshTokenInfo', async () => {
      const userId = BigInt(1234567890);
      const refreshTokenExpSec = 604800;
      const refreshToken = 'refreshToken';

      jwtService.signAsync.mockResolvedValue(refreshToken);
      const result = await authService.createRefreshToken(Number(userId), refreshTokenExpSec);
      expect(result).toEqual({
        refreshToken,
        refreshTokenExp: expect.any(Date)
      });
    });
  });

  describe('reissueToken', () => {
    it('should return an object of type ReissuedToken', async () => {
      const auth = {
        id: 1,
        userId: BigInt(1234567890),
        refreshToken: 'refreshToken',
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken',
        refreshTokenExp: AuthService.getExpDate(604800000)
      };
      const newKakaoToken: ReissueTokenDto = {
        tokenType: 'bearer',
        accessToken: 'newKakaoAccessToken',
        expiresIn: 3600
      };
      const accessTokenInfo: AccessTokenInfo = {
        accessToken: 'newAccessToken',
        exp: AuthService.getExpDate(AuthService.convertSecondsToMillis(newKakaoToken.expiresIn))
      };
      const updateAuthDto: UpdateAuthDto = {
        kakaoAccessToken: newKakaoToken.accessToken
      };
      const reissuedToken: ReissuedToken = accessTokenInfo;

      authService.findOne = jest.fn().mockResolvedValue(auth);
      kakaoLoginService.reissueToken.mockResolvedValue(newKakaoToken);
      authService.createAccessToken = jest.fn().mockResolvedValue(accessTokenInfo);
      authService.update = jest.fn().mockResolvedValue(updateAuthDto);
      const result = await authService.reissueToken(auth.refreshToken, auth.userId);
      expect(result).toEqual(reissuedToken);
    });

    it('should throw UnauthorizedException when refreshToken is invalid or expired', async () => {
      authService.findOne = jest.fn().mockResolvedValue(null);
      expect(authService.reissueToken('invalid-token', BigInt(1234567890))).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token')
      );
    });
  });
});
