import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Auth, User } from '@prisma/client';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

import { DecodedJWT, JwtPayload, Token } from '@/types/auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly kakaoLoginService: KakaoLoginService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {}

  async create(createAuthDto: CreateAuthDto): Promise<Auth> {
    const hashedRefreshToken = createAuthDto.refreshToken;
    const hashedKaKaoAccessToken = createAuthDto.kakaoAccessToken;
    const hashedKaKaoRefreshToken = createAuthDto.kakaoRefreshToken;

    return this.prismaService.auth.create({
      data: {
        ...createAuthDto,
        refreshToken: hashedRefreshToken,
        kakaoAccessToken: hashedKaKaoAccessToken,
        kakaoRefreshToken: hashedKaKaoRefreshToken
      }
    });
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
    const auth = await this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId,
          refreshToken
        }
      }
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (new Date() > auth.refreshTokenExp) {
      this.remove(auth.id);
      throw new UnauthorizedException('expired refresh token');
    }

    return auth;
  }

  async createAccessToken(id: bigint, expMills: number) {
    const payload: JwtPayload = {
      id
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: expMills
    });

    return { accessToken, exp: AuthService.getExpDate(expMills) };
  }

  async createRefreshToken(id: bigint, expMills: number) {
    const payload: JwtPayload = {
      id
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: expMills
    });

    return { refreshToken, refreshTokenExp: AuthService.getExpDate(expMills) };
  }

  async decodeRefreshToken(token: string): Promise<DecodedJWT> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET')
    });
  }

  private static convertSecondsToMills(seconds: number) {
    return seconds * 1000;
  }

  private static getExpDate(expMills: number) {
    return new Date(Date.now() + expMills);
  }

  async login(code: string): Promise<{ user: User; token: Token }> {
    const { user: kakaoUser, token: kakaoToken } = await this.kakaoLoginService.login(code);
    const expMills = AuthService.convertSecondsToMills(kakaoToken.expiresIn);
    const { accessToken, exp } = await this.createAccessToken(kakaoUser.id, expMills);
    const refreshTokenExpMills = AuthService.convertSecondsToMills(
      kakaoToken.refreshTokenExpiresIn
    );
    const { refreshToken, refreshTokenExp } = await this.createRefreshToken(
      kakaoUser.id,
      refreshTokenExpMills
    );
    const user = await this.userService.findOne(kakaoUser.id);
    let userId: bigint;

    if (!user) {
      const { id } = await this.userService.create({ id: kakaoUser.id });
      userId = id;
    } else {
      userId = user.id;
    }

    const createAuthDto: CreateAuthDto = {
      userId,
      refreshToken,
      refreshTokenExp,
      kakaoAccessToken: kakaoToken.accessToken,
      kakaoRefreshToken: kakaoToken.refreshToken
    };
    this.create(createAuthDto);

    return {
      user,
      token: {
        accessToken,
        exp,
        refreshToken,
        refreshTokenExp
      }
    };
  }

  async refresh(refreshToken: string) {
    const { id } = await this.decodeRefreshToken(refreshToken);
    const auth = await this.findOne(id, refreshToken);

    if (!auth) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const refreshedKakaoToken = await this.kakaoLoginService.refreshToken(auth.kakaoRefreshToken);
    const expMills = AuthService.convertSecondsToMills(refreshedKakaoToken.expiresIn);
    const { accessToken, exp } = await this.createAccessToken(id, expMills);

    const updateAuthDto: UpdateAuthDto = {
      kakaoAccessToken: refreshedKakaoToken.accessToken
    };
    const newToken: Token = {
      accessToken,
      exp
    };

    if (refreshedKakaoToken.refreshToken) {
      const refreshTokenExpMills = AuthService.convertSecondsToMills(
        refreshedKakaoToken.refreshTokenExpiresIn
      );
      const { refreshToken: newRefreshToken, refreshTokenExp } = await this.createRefreshToken(
        id,
        refreshTokenExpMills
      );

      updateAuthDto.kakaoRefreshToken = refreshedKakaoToken.refreshToken;
      updateAuthDto.refreshToken = newRefreshToken;
      updateAuthDto.refreshTokenExp = refreshTokenExp;

      newToken.refreshToken = newRefreshToken;
      newToken.refreshTokenExp = refreshTokenExp;
    }

    await this.update(auth.id, updateAuthDto);
    return newToken;
  }
}
