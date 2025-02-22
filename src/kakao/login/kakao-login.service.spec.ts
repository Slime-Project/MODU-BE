import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { plainToInstance } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';

import { kakaoUserInfoResMock, kakaoUsersResMock } from '@/utils/unit-test';

import { GetTokenDto } from './dto/get-token.dto';
import { KaKaoUserInfoDto } from './dto/kakao-user-info.dto';
import { ReissueTokenDto } from './dto/reissue-token.dto';
import { KakaoLoginService } from './kakao-login.service';

import { GetTokenRes, ReissueTokenRes } from '@/types/kakao.type';

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

  describe('getMyInfo', () => {
    it('should return user information', async () => {
      const accessToken = 'kakaoAccessToken';
      const user = plainToInstance(KaKaoUserInfoDto, kakaoUserInfoResMock, {
        excludeExtraneousValues: true
      });

      axios.get = jest.fn().mockResolvedValue({ data: kakaoUserInfoResMock });
      const result = await KakaoLoginService.getMyInfo(accessToken);
      expect(result).toEqual(user);
    });
  });

  describe('getUserInfo', () => {
    it('should return user information', async () => {
      const user = plainToInstance(KaKaoUserInfoDto, kakaoUserInfoResMock, {
        excludeExtraneousValues: true
      });

      axios.get = jest.fn().mockResolvedValue({ data: kakaoUserInfoResMock });
      const result = await kakaoLoginService.getUserInfo(kakaoUserInfoResMock.id);
      expect(result).toEqual(user);
    });
  });

  describe('findUsers', () => {
    it('should return users information', async () => {
      const users = kakaoUsersResMock.map(user =>
        plainToInstance(KaKaoUserInfoDto, user, { excludeExtraneousValues: true })
      );
      axios.get = jest.fn().mockResolvedValue({ data: kakaoUsersResMock });
      const result = await kakaoLoginService.findUsers(kakaoUsersResMock.map(({ id }) => id));
      expect(result).toEqual(users);
    });
  });

  describe('login', () => {
    it('should return a kakao token and user', async () => {
      const code = 'test-code';
      const token: GetTokenDto = {
        accessToken: 'kakaoAccessToken',
        refreshToken: 'kakaoRefreshToken',
        expiresIn: 3600,
        refreshTokenExpiresIn: 604800
      };
      const user: KaKaoUserInfoDto = {
        id: '1234567890',
        nickname: 'nickname',
        profileImg: 'url'
      };

      kakaoLoginService.getToken = jest.fn().mockResolvedValue(token);
      KakaoLoginService.getMyInfo = jest.fn().mockResolvedValue(user);
      const result = await kakaoLoginService.login(code);
      expect(result).toEqual({ user, token });
    });
  });

  describe('logout', () => {
    it('should call axios post method for Kakao logout', async () => {
      const data = { id: 1234567890 };
      axios.post = jest.fn().mockResolvedValue({ data });
      await KakaoLoginService.logout('kakaoAccessToken');
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should call axios post method for Kakao unlink', async () => {
      const data = { id: 1234567890 };
      axios.post = jest.fn().mockResolvedValue({ data });
      await KakaoLoginService.unlink('kakaoAccessToken');
      expect(axios.post).toHaveBeenCalled();
    });
  });
});
