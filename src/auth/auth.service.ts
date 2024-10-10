import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';

import { LoginResDto } from '@/auth/dto/login-res.dto';
import { UserService } from '@/user/user.service';

import { LoginReqDto } from './dto/login-req.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(loginReqDto: LoginReqDto): Promise<User> {
    const { id, password } = loginReqDto;

    const user = await this.userService.findOne(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const comparePassword = await compare(password, user.password);

    if (!comparePassword) {
      throw new UnauthorizedException('password is wrong');
    }

    return user;
  }

  async createAccessToken(user: User) {
    const payload = {
      userId: user.id
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: parseInt(this.configService.get('JWT_ACCESS_TOKEN_EXP'), 10)
    });

    return accessToken;
  }

  async createRefreshToken(user: User) {
    const payload = {
      userId: user.id
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: parseInt(this.configService.get('JWT_REFRESH_TOKEN_EXP'), 10)
    });

    return refreshToken;
  }

  getAccessTokenExpDate() {
    const exp = parseInt(this.configService.get('JWT_ACCESS_TOKEN_EXP'), 10);
    return new Date(Date.now() + exp);
  }

  getRefreshTokenExpDate() {
    const exp = parseInt(this.configService.get('JWT_REFRESH_TOKEN_EXP'), 10);
    return new Date(Date.now() + exp);
  }

  async setUserCurrentRefreshToken(id: string, refreshToken: string): Promise<User> {
    const hashedRefreshToken = await hash(refreshToken, 10);
    const refreshTokenExp = this.getRefreshTokenExpDate();

    return this.userService.update(id, {
      currentRefreshToken: hashedRefreshToken,
      currentRefreshTokenExp: refreshTokenExp
    });
  }

  async login(loginReqDto: LoginReqDto) {
    console.log(loginReqDto);
    const user = await this.validateUser(loginReqDto);
    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    const updatedUser = await this.setUserCurrentRefreshToken(user.id, refreshToken);

    const loginResDto: LoginResDto = {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      picture: updatedUser.picture
    };

    return {
      user: loginResDto,
      accessToken,
      refreshToken
    };
  }

  async compareUserRefreshToken(id: string, refreshToken: string) {
    const user = await this.userService.findOne(id);

    if (!user?.currentRefreshToken) {
      return false;
    }

    const result = await compare(refreshToken, user.currentRefreshToken);

    return result;
  }

  async refresh(id: string, refreshToken: string) {
    const result = this.compareUserRefreshToken(id, refreshToken);

    if (!result) {
      throw new UnauthorizedException('You need to log in first');
    }

    const user = await this.userService.findOne(id);
    const accessToken = await this.createAccessToken(user);

    return {
      accessToken
    };
  }
}
