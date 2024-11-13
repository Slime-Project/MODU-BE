import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Auth, UserRole } from '@prisma/client';

import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

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
    private readonly userService: UserService,
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

  async create(code: string): Promise<{ user: CreateAuthResDto; token: TokensInfo }> {
    const { user: kakaoUser, token: kakaoToken } = await this.kakaoLoginService.login(code);
    const { accessToken, exp } = await this.createAccessToken(kakaoUser.id, kakaoToken.expiresIn);
    const { refreshToken, refreshTokenExp } = await this.createRefreshToken(
      kakaoUser.id,
      kakaoToken.refreshTokenExpiresIn
    );
    let user = await this.userService.findOne(BigInt(kakaoUser.id));
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
          this.userService.create({ id: BigInt(kakaoUser.id), role: UserRole.USER }, prisma),
          prisma.auth.create({
            data: createAuth
          })
        ]);
        return createdUser;
      });
    } else {
      await this.prismaService.auth.create({
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

  async update(id: number, data: UpdateAuthDto): Promise<Auth> {
    return this.prismaService.auth.update({
      where: { id },
      data
    });
  }

  async remove(id: number): Promise<Auth> {
    return this.prismaService.auth.delete({
      where: { id }
    });
  }

  async findOne(userId: bigint, refreshToken: string): Promise<Auth> {
    return this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId,
          refreshToken
        }
      }
    });
  }

  async reissueToken(refreshToken: string, id: bigint) {
    const auth = await this.findOne(id, refreshToken);
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

    await this.update(auth.id, updateAuthDto);
    return reissuedToken;
  }
}
