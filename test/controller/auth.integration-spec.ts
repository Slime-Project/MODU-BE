import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { LoginResDto } from '@/auth/dto/login-res.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { ReissueTokenDto } from '@/kakao/login/dto/reissue-token.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createTestingApp,
  createUser,
  deleteUser,
  mockKakaoLogin,
  validateDto
} from '@/utils/integration-test';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let kakaoLoginService: KakaoLoginService;
  let prismaService: PrismaService;
  const id = '1234567890';

  beforeEach(async () => {
    app = await createTestingApp([AuthModule]);
    kakaoLoginService = app.get(KakaoLoginService);
    prismaService = app.get(PrismaService);
  });

  describe('/api/auth/login (POST)', () => {
    it('201', async () => {
      const req: LoginDto = { code: 'testCode' };

      mockKakaoLogin(kakaoLoginService, id);
      const res = await request(app.getHttpServer()).post('/api/auth/login').send(req).expect(201);

      validateDto(LoginResDto, res.body);

      const cookies = res.get('Set-Cookie');
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Secure');
      expect(accessTokenCookie).toContain('SameSite=Strict');

      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Secure');
      expect(refreshTokenCookie).toContain('SameSite=Strict');

      await deleteUser(prismaService, id);
    });

    it('400', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ code: 'invalidCode' })
        .expect(400);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('204', async () => {
      const { accessTokenCookie, refreshTokenCookie } = await createUser(app, id);

      KakaoLoginService.logout = jest.fn().mockResolvedValue({
        id
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie])
        .expect(204);
      const cookies = res.get('Set-Cookie');
      const resAccessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
      expect(resAccessTokenCookie).toBeDefined();
      expect(resAccessTokenCookie).toContain('HttpOnly');
      expect(resAccessTokenCookie).toContain('Secure');
      expect(resAccessTokenCookie).toContain('SameSite=Strict');
      const expires = resAccessTokenCookie.match(/expires=([^;]+);?/);
      expect(expires).toBeDefined();

      if (expires) {
        const expiresDate = new Date(expires[1]);
        expect(expiresDate.getTime()).toBeLessThan(Date.now());
      }

      const resRefreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
      expect(resRefreshTokenCookie).toBeDefined();
      expect(resRefreshTokenCookie).toContain('HttpOnly');
      expect(resRefreshTokenCookie).toContain('Secure');
      expect(resRefreshTokenCookie).toContain('SameSite=Strict');
      const refreshTokenExpires = resRefreshTokenCookie.match(/expires=([^;]+);?/);
      expect(refreshTokenExpires).toBeDefined();

      if (refreshTokenExpires) {
        const expiresDate = new Date(refreshTokenExpires[1]);
        expect(expiresDate.getTime()).toBeLessThan(Date.now());
      }

      await deleteUser(prismaService, id);
    });

    it('400', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ code: 'invalidCode' })
        .expect(400);
    });
  });

  describe('/api/auth/token/reissue (POST)', () => {
    it('204', async () => {
      const { refreshTokenCookie } = await createUser(app, id);
      const kakaoReissuedToken = {
        accessToken: 'newKakaoAccessToken',
        refreshToken: 'newKkakaoRefreshToken',
        expiresIn: 3600,
        refreshTokenExpiresIn: 604800
      } as ReissueTokenDto;

      kakaoLoginService.reissueToken = jest.fn().mockResolvedValue(kakaoReissuedToken);
      const res = await request(app.getHttpServer())
        .post('/api/auth/token/reissue')
        .set('Cookie', [refreshTokenCookie])
        .expect(204);

      const cookies = res.get('Set-Cookie');

      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Secure');
      expect(accessTokenCookie).toContain('SameSite=Strict');

      await deleteUser(prismaService, id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).post('/api/auth/token/reissue').expect(401);
    });
  });
});
