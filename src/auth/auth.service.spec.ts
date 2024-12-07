import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { GetTokenDto } from '@/kakao/login/dto/get-token.dto';
import { ReissueTokenDto } from '@/kakao/login/dto/reissue-token.dto';
import { UserInfoDto } from '@/kakao/login/dto/user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';
import { getMockAuth } from '@/utils/unit-test';

import { AuthService } from './auth.service';
import { CreateAuthResDto } from './dto/create-auth-res.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

import { AccessTokenInfo, RefreshTokenInfo, ReissuedToken, TokensInfo } from '@/types/auth.type';

describe('AuthService', () => {
  let authService: AuthService;
  let kakaoLoginService: DeepMockProxy<KakaoLoginService>;
  let prismaService: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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
    kakaoLoginService = module.get(KakaoLoginService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  const setupCreateAccessTokenMock = (expMillis: number, accessToken: string = 'accessToken') => {
    const accessTokenInfo: AccessTokenInfo = {
      accessToken,
      exp: AuthService.getExpDate(expMillis)
    };
    authService.createAccessToken = jest.fn().mockResolvedValue(accessTokenInfo);
    return accessTokenInfo;
  };

  const setupCreateRefreshTokenMock = (
    refreshExpMillis: number,
    refreshToken: string = 'refreshToken'
  ) => {
    const refreshTokenInfo: RefreshTokenInfo = {
      refreshToken,
      refreshTokenExp: AuthService.getExpDate(refreshExpMillis)
    };
    authService.createRefreshToken = jest.fn().mockResolvedValue(refreshTokenInfo);
    return refreshTokenInfo;
  };

  describe('login', () => {
    const setupKakaoLoginMock = () => {
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
      kakaoLoginService.login.mockResolvedValue({
        user: kakaoUser,
        token: kakaoToken
      });
      return { kakaoUser, kakaoToken };
    };

    const setupCreateAuthMocks = async () => {
      const { kakaoToken, kakaoUser } = setupKakaoLoginMock();

      const refreshExpMillis = AuthService.convertSecondsToMillis(kakaoToken.refreshTokenExpiresIn);
      const expMillis = AuthService.convertSecondsToMillis(kakaoToken.expiresIn);
      const accessTokenInfo = setupCreateAccessTokenMock(expMillis);
      const refreshTokenInfo = setupCreateRefreshTokenMock(refreshExpMillis);

      const token: TokensInfo = {
        ...accessTokenInfo,
        ...refreshTokenInfo
      };
      const user: User = { id: BigInt(kakaoUser.id), role: UserRole.USER };

      return {
        user,
        token
      };
    };

    it('should return a user and an auth record if the user already exists', async () => {
      const { user, token } = await setupCreateAuthMocks();
      prismaService.user.findUnique.mockResolvedValue({ id: user.id, role: UserRole.USER });
      const createAuthResDto: CreateAuthResDto = { id: Number(user.id) };
      const result = await authService.login('mockCode');
      expect(result).toEqual({
        user: createAuthResDto,
        token
      });
    });

    it('should return a user and an auth record if the user is new', async () => {
      const { user, token } = await setupCreateAuthMocks();
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockResolvedValue(user);
      const createAuthResDto: CreateAuthResDto = { id: Number(user.id) };
      const result = await authService.login('mockCode');
      expect(result).toEqual({
        user: createAuthResDto,
        token
      });
    });
  });

  describe('removeExpiredAuthRecords', () => {
    it('should return the count of deleted auth records', async () => {
      const count = 5;
      prismaService.auth.deleteMany.mockResolvedValue({ count });
      const result = await authService.removeExpiredAuthRecords();
      expect(result).toEqual({ count });
    });
  });

  describe('createAccessToken', () => {
    it('should return an object of type AccessTokenInfo', async () => {
      const expSec = 3600000;
      const accessToken = 'accessToken';

      jwtService.signAsync.mockResolvedValue(accessToken);
      const result = await authService.createAccessToken(1234567890, expSec);
      expect(result).toEqual({
        accessToken,
        exp: expect.any(Date)
      });
    });
  });

  describe('createRefreshToken', () => {
    it('should return an object of type RefreshTokenInfo', async () => {
      const refreshTokenExpSec = 604800;
      const refreshToken = 'refreshToken';

      jwtService.signAsync.mockResolvedValue(refreshToken);
      const result = await authService.createRefreshToken(1234567890, refreshTokenExpSec);
      expect(result).toEqual({
        refreshToken,
        refreshTokenExp: expect.any(Date)
      });
    });
  });

  describe('reissueToken', () => {
    const setupCreateNewAccessTokenMock = (expMillis: number) => {
      return setupCreateAccessTokenMock(expMillis, 'newAccessToken');
    };

    const setupCreateNewRefreshTokenMock = (refreshExpMillis: number) => {
      return setupCreateRefreshTokenMock(refreshExpMillis, 'newRefreshToken');
    };

    const setupFindOneAuthMock = () => {
      const auth = getMockAuth();
      prismaService.auth.findUnique.mockResolvedValue(auth);
      return auth;
    };

    it('should return a reissued accessToken', async () => {
      const auth = setupFindOneAuthMock();
      const newKakaoToken: ReissueTokenDto = {
        tokenType: 'bearer',
        accessToken: 'newKakaoAccessToken',
        expiresIn: 3600
      };
      const expMillis = AuthService.convertSecondsToMillis(newKakaoToken.expiresIn);
      const accessTokenInfo = setupCreateNewAccessTokenMock(expMillis);
      const updateAuthDto: UpdateAuthDto = {
        kakaoAccessToken: newKakaoToken.accessToken
      };
      const reissuedToken: ReissuedToken = accessTokenInfo;

      kakaoLoginService.reissueToken.mockResolvedValue(newKakaoToken);
      prismaService.auth.update.mockResolvedValue({ ...auth, ...updateAuthDto });
      const result = await authService.reissueToken(auth.refreshToken, auth.userId);
      expect(result).toEqual(reissuedToken);
    });

    it('should return a reissed accessToken and refreshToken', async () => {
      const auth = setupFindOneAuthMock();
      const newKakaoToken: ReissueTokenDto = {
        tokenType: 'bearer',
        accessToken: 'newKakaoAccessToken',
        expiresIn: 3600,
        refreshToken: 'newKakaoRefreshToken',
        refreshTokenExpiresIn: 604800
      };
      const expMillis = AuthService.convertSecondsToMillis(newKakaoToken.expiresIn);
      const refreshExpMillis = AuthService.convertSecondsToMillis(
        newKakaoToken.refreshTokenExpiresIn
      );
      const accessTokenInfo = setupCreateNewAccessTokenMock(expMillis);
      const refreshTokenInfo = setupCreateNewRefreshTokenMock(refreshExpMillis);
      const updateAuthDto: UpdateAuthDto = {
        kakaoAccessToken: newKakaoToken.accessToken,
        kakaoRefreshToken: newKakaoToken.refreshToken
      };
      const reissuedToken: ReissuedToken = { ...accessTokenInfo, ...refreshTokenInfo };

      kakaoLoginService.reissueToken.mockResolvedValue(newKakaoToken);
      prismaService.auth.update.mockResolvedValue({ ...auth, ...updateAuthDto });
      const result = await authService.reissueToken(auth.refreshToken, auth.userId);
      expect(result).toEqual(reissuedToken);
    });
  });

  describe('logout', () => {
    it('should remove auth and log out from Kakao', async () => {
      const auth = getMockAuth();
      prismaService.auth.findUnique.mockResolvedValue(auth);
      KakaoLoginService.logout = jest.fn().mockResolvedValue({ id: auth.userId });
      prismaService.auth.delete.mockResolvedValue(auth);
      await authService.logout(auth.userId, auth.refreshToken);
      expect(prismaService.auth.delete).toHaveBeenCalled();
      expect(KakaoLoginService.logout).toHaveBeenCalledWith(auth.kakaoAccessToken);
    });
  });
});
