import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { plainToInstance } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';

import { GetTokenDto } from './dto/get-token.dto';
import { ReissueTokenDto } from './dto/reissue-token.dto';
import { UserInfoDto } from './dto/user-info.dto';
import { KakaoLoginService } from './kakao-login.service';

import { GetTokenRes, ReissueTokenRes, UserInfoRes } from '@/types/kakao.type';

describe('KakaoLoginService', () => {
  let kakaoLoginService: KakaoLoginService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        KakaoLoginService,
        { provide: ConfigService, useValue: mockDeep<ConfigService>() }
      ]
    }).compile();

    kakaoLoginService = module.get(KakaoLoginService);
  });

  it('should be defined', () => {
    expect(kakaoLoginService).toBeDefined();
  });

  describe('getToken', () => {
    it('should return a token', async () => {
      const accessToken = 'kakaoRefreshToken';
      const res: GetTokenRes = {
        token_type: 'bearer',
        access_token: 'newKakaoAccessToken',
        expires_in: 3600,
        refresh_token: 'newKakaoRefreshToken',
        refresh_token_expires_in: 604800
      };
      const token = plainToInstance(GetTokenDto, res, { excludeExtraneousValues: true });

      axios.post = jest.fn().mockResolvedValue({ data: res });
      const result = await kakaoLoginService.getToken(accessToken);
      expect(result).toEqual(token);
    });
    it('should throw BadRequestException when code is invalid', async () => {
      const code = 'test-code';
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 400
        }
      } as AxiosError;

      axios.post = jest.fn().mockRejectedValue(errorResponse);
      expect(kakaoLoginService.getToken(code)).rejects.toThrow(
        new BadRequestException('Invalid code')
      );
    });
  });

  describe('reissueToken', () => {
    it('should return a reissued token', async () => {
      const refreshToken = 'kakaoRefreshToken';
      const res: ReissueTokenRes = {
        token_type: 'bearer',
        access_token: 'newKakaoAccessToken',
        expires_in: 3600,
        refresh_token: 'newKakaoRefreshToken',
        refresh_token_expires_in: 604800
      };
      const token = plainToInstance(ReissueTokenDto, res, { excludeExtraneousValues: true });

      axios.post = jest.fn().mockResolvedValue({ data: res });
      const result = await kakaoLoginService.reissueToken(refreshToken);
      expect(result).toEqual(token);
    });
  });

  describe('getUserInfo', () => {
    it('should return user', async () => {
      const accessToken = 'kakaoAccessToken';
      const res: UserInfoRes = {
        id: 1234567890,
        connected_at: new Date().toISOString(),
        properties: {
          nickname: 'nickname',
          profile_image: 'url',
          thumbnail_image: 'url'
        },
        kakao_account: {
          profile_nickname_needs_agreement: false,
          profile_image_needs_agreement: false,
          profile: {
            nickname: 'nickname',
            thumbnail_image_url: 'url',
            profile_image_url: 'url',
            is_default_image: true,
            is_default_nickname: false
          }
        }
      };
      const user = plainToInstance(UserInfoDto, res, { excludeExtraneousValues: true });

      axios.get = jest.fn().mockResolvedValue({ data: res });
      const result = await KakaoLoginService.getUserInfo(accessToken);
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should return a kakao token and user', async () => {
      const code = 'test-code';
      const token = {
        accessToken: 'kakaoAccessToken',
        refreshToken: 'kakaoRefreshToken',
        expiresIn: 3600,
        refreshTokenExpiresIn: 604800
      } as GetTokenDto;
      const user = {
        id: 1234567890,
        properties: {
          nickname: 'nickname',
          profileImage: 'url'
        }
      } as UserInfoDto;

      kakaoLoginService.getToken = jest.fn().mockResolvedValue(token);
      KakaoLoginService.getUserInfo = jest.fn().mockResolvedValue(user);
      const result = await kakaoLoginService.login(code);
      expect(result).toEqual({ user, token });
    });
  });

  describe('logout', () => {
    it('should return an object containing an id', async () => {
      const data = { id: 1234567890 };
      axios.post = jest.fn().mockResolvedValue({ data });
      const result = await KakaoLoginService.logout('kakaoAccessToken');
      expect(result).toEqual(data);
    });
  });
});
