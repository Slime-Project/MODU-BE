import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUserResDto } from '@/user/dto/get-user-res.dto';
import { UserModule } from '@/user/user.module';
import { createTestingApp, createUser, deleteUser, validateResDto } from '@/utils/integration-test';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const id = '9876543210';

  beforeEach(async () => {
    app = await createTestingApp([UserModule, AuthModule]);
    prismaService = app.get(PrismaService);
  });

  describe('/api/user (GET)', () => {
    it('200', async () => {
      const { refreshTokenCookie, kakaoUser } = await createUser(app, id);

      KakaoLoginService.getUserInfo = jest.fn().mockResolvedValue(kakaoUser);
      const { body } = await request(app.getHttpServer())
        .get('/api/user')
        .set('Cookie', [refreshTokenCookie])
        .expect(200);
      validateResDto(GetUserResDto, body);

      await deleteUser(prismaService, id);
    });

    it('401', async () => {
      return request(app.getHttpServer()).get('/api/user').expect(401);
    });
  });

  describe('/api/user (DELETE)', () => {
    it('204', async () => {
      const { refreshTokenCookie } = await createUser(app, id);

      KakaoLoginService.unlink = jest.fn().mockResolvedValue({
        id
      });
      const res = await request(app.getHttpServer())
        .delete('/api/user')
        .set('Cookie', [refreshTokenCookie])
        .expect(204);
      const cookies = res.get('Set-Cookie');
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Secure');
      expect(accessTokenCookie).toContain('SameSite=Strict');
      const expires = accessTokenCookie.match(/expires=([^;]+);?/);
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
