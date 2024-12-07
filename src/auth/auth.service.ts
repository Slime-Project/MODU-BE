import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

import { UpdateAuthDto } from './dto/update-auth.dto';

import {
  JwtPayload,
  AccessTokenInfo,
  RefreshTokenInfo,
  TokensInfo,
  ReissuedToken,
  CreateAuth
} from '@/types/auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly kakaoLoginService: KakaoLoginService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {}

  static convertSecondsToMillis(seconds: number) {
    return seconds * 1000;
  }

  static getExpDate(expMillis: number) {
    return new Date(Date.now() + expMillis);
  }

  async createAccessToken(id: number, expSec: number): Promise<AccessTokenInfo> {
    const payload: JwtPayload = {
      id
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: expSec
    });
    const expMillis = AuthService.convertSecondsToMillis(expSec);
    const expDate = AuthService.getExpDate(expMillis);
    return { accessToken, exp: expDate };
  }

  async createRefreshToken(id: number, expSec: number): Promise<RefreshTokenInfo> {
    const payload: JwtPayload = {
      id
    };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: expSec
    });
    const expMillis = AuthService.convertSecondsToMillis(expSec);
    const expDate = AuthService.getExpDate(expMillis);
    return { refreshToken, refreshTokenExp: expDate };
  }

  // async create(data: CreateAuth, prisma?: Omit<PrismaClient, ITXClientDenyList>): Promise<Auth> {
  //   return (prisma || this.prismaService).auth.create({
  //     data
  //   });
  // }

  async login(code: string): Promise<{ user: CreateAuthResDto; token: TokensInfo }> {
    const { user: kakaoUser, token: kakaoToken } = await this.kakaoLoginService.login(code);
    const { accessToken, exp } = await this.createAccessToken(kakaoUser.id, kakaoToken.expiresIn);
    const { refreshToken, refreshTokenExp } = await this.createRefreshToken(
      kakaoUser.id,
      kakaoToken.refreshTokenExpiresIn
    );
    let user = await this.prismaService.user.findUnique({
      where: { id: BigInt(kakaoUser.id) }
    });
    const createAuth: CreateAuth = {
      userId: BigInt(kakaoUser.id),
      refreshToken,
      refreshTokenExp,
      kakaoAccessToken: kakaoToken.accessToken,
      kakaoRefreshToken: kakaoToken.refreshToken
    };

    if (!user) {
      user = await this.prismaService.$transaction(async prisma => {
        const [createdUser] = await Promise.all([
          prisma.user.create({
            data: { id: BigInt(kakaoUser.id), role: UserRole.USER }
          }),
          prisma.auth.create({
            data: createAuth
          })
        ]);
        return createdUser;
      });
    } else {
      this.prismaService.auth.create({
        data: createAuth
      });
    }

    return {
      user: { id: Number(user.id) },
      token: {
        accessToken,
        exp,
        refreshToken,
        refreshTokenExp
      }
    };
  }

  async removeExpiredAuthRecords() {
    return this.prismaService.auth.deleteMany({
      where: {
        refreshTokenExp: { lte: new Date() }
      }
    });
  }

  async reissueToken(refreshToken: string, id: bigint) {
    const auth = await this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId: id,
          refreshToken
        }
      }
    });
    const newKakaoToken = await this.kakaoLoginService.reissueToken(auth.kakaoRefreshToken);
    const { accessToken, exp } = await this.createAccessToken(Number(id), newKakaoToken.expiresIn);

    const updateAuthDto: UpdateAuthDto = {
      kakaoAccessToken: newKakaoToken.accessToken
    };
    const reissuedToken: ReissuedToken = {
      accessToken,
      exp
    };

    if (newKakaoToken.refreshToken) {
      const { refreshToken: newRefreshToken, refreshTokenExp } = await this.createRefreshToken(
        Number(id),
        newKakaoToken.expiresIn
      );

      updateAuthDto.kakaoRefreshToken = newKakaoToken.refreshToken;
      updateAuthDto.refreshToken = newRefreshToken;
      updateAuthDto.refreshTokenExp = refreshTokenExp;

      reissuedToken.refreshToken = newRefreshToken;
      reissuedToken.refreshTokenExp = refreshTokenExp;
    }

    await this.prismaService.auth.update({
      where: { id: auth.id },
      data: updateAuthDto
    });
    return reissuedToken;
  }

  async logout(id: bigint, refreshToken: string) {
    const auth = await this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId: id,
          refreshToken
        }
      }
    });
    await KakaoLoginService.logout(auth.kakaoAccessToken);
    await this.prismaService.auth.delete({
      where: { id: auth.id }
    }); // 카카오 로그아웃 성공 시
  }
}
