import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';

import { GetTokenDto } from './dto/get-token.dto';
import { ReissueTokenDto } from './dto/reissue-token.dto';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class KakaoLoginService {
  constructor(private readonly configService: ConfigService) {}

  private static readonly tokenUrl = 'https://kauth.kakao.com/oauth/token';

  async getToken(code: string) {
    try {
      const body = {
        grant_type: 'authorization_code',
        client_id: this.configService.get('KAKAO_REST_API_KEY'),
        redirect_uri: this.configService.get('KAKAO_REDIRECT_URL'),
        code,
        client_secret: this.configService.get('KAKAO_CLIENT_SECRET')
      };
      const { data } = await axios.post(KakaoLoginService.tokenUrl, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });
      return plainToInstance(GetTokenDto, data, { excludeExtraneousValues: true });
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response.status >= 400 &&
        error.response.status < 500
      ) {
        throw new BadRequestException('Invalid code');
      }

      throw new InternalServerErrorException();
    }
  }

  async reissueToken(refreshToken: string) {
    const body = {
      grant_type: 'refresh_token',
      client_id: this.configService.get('KAKAO_REST_API_KEY'),
      refresh_token: refreshToken,
      client_secret: this.configService.get('KAKAO_CLIENT_SECRET')
    };

    const { data } = await axios.post(KakaoLoginService.tokenUrl, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    return plainToInstance(ReissueTokenDto, data, { excludeExtraneousValues: true });
  }

  static async getUserInfo(accessToken: string) {
    const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
    const { data } = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return plainToInstance(UserInfoDto, data, { excludeExtraneousValues: true });
  }

  async login(code: string) {
    const token = await this.getToken(code);
    const user = await KakaoLoginService.getUserInfo(token.accessToken);
    return {
      token,
      user
    };
  }

  static async logout(accessToken: string) {
    const logoutUrl = 'https://kapi.kakao.com/v1/user/logout';
    const { data } = await axios.post(logoutUrl, null, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return data;
  }
}
