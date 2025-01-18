import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/user/dto/user.dto';
import { UserModule } from '@/user/user.module';
import { createTestingApp, createUser, deleteUser, validateDto } from '@/utils/integration-test';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp([UserModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  describe('/api/user (GET)', () => {
    it('200', async () => {
      const id = '4';
      const { accessTokenCookie, refreshTokenCookie, kakaoUser } = await createUser(app, id);

      KakaoLoginService.getMyInfo = jest.fn().mockResolvedValue(kakaoUser);
      const { body } = await request(app.getHttpServer())
        .get('/api/user')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie])
        .expect(200);
      validateDto(UserDto, body);

      await deleteUser(prismaService, id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).get('/api/user').expect(401);
    });
  });

  describe('/api/user (DELETE)', () => {
    it('204', async () => {
      const id = '9';
      const { accessTokenCookie, refreshTokenCookie } = await createUser(app, id);

      KakaoLoginService.unlink = jest.fn();
      const res = await request(app.getHttpServer())
        .delete('/api/user')
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
    });

    it('401', async () => {
      return request(app.getHttpServer()).delete('/api/user').expect(401);
    });
  });
});
