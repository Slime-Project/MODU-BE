import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { AuthModule } from '@/auth/auth.module';
import { CreateAuthReqDto } from '@/auth/dto/create-auth-req.dto';
import { GetTokenDto } from '@/kakao/login/dto/get-token.dto';
import { ReissueTokenDto } from '@/kakao/login/dto/reissue-token.dto';
import { UserInfoDto } from '@/kakao/login/dto/user-info.dto';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let kakaoLoginService: KakaoLoginService;
  let prismaService: PrismaService;
  const id = BigInt(1234567890);

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AuthModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
    kakaoLoginService = moduleFixture.get(KakaoLoginService);
    prismaService = moduleFixture.get(PrismaService);
  });

  const mockKakaoLogin = () => {
    const kakaoToken = {
      accessToken: 'kakaoAccessToken',
      refreshToken: 'kakaoRefreshToken',
      expiresIn: 3600,
      refreshTokenExpiresIn: 604800
    } as GetTokenDto;
    const kakaoUser = {
      id: Number(id),
      properties: {
        nickname: 'nickname',
        profileImage: 'url'
      }
    } as UserInfoDto;

    kakaoLoginService.login = jest.fn().mockResolvedValue({
      user: kakaoUser,
      token: kakaoToken
    });
  };

  const createUser = async () => {
    const req: CreateAuthReqDto = { code: 'testCode' };

    mockKakaoLogin();
    const { header } = await request(app.getHttpServer()).post('/api/auth/login').send(req);

    const cookies = header['set-cookie'] as unknown as string[];
    const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refresh_token='));
    return { refreshTokenCookie };
  };

  const deleteUser = async () => {
    await prismaService.auth.deleteMany({
      where: { userId: id }
    });
    await prismaService.user.delete({
      where: {
        id
      }
    });
  };

  describe('/api/auth/login (POST)', () => {
    it('201', async () => {
      const req: CreateAuthReqDto = { code: 'testCode' };

      mockKakaoLogin();
      const res = await request(app.getHttpServer()).post('/api/auth/login').send(req).expect(201);

      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('number');

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

      await deleteUser();
    });

    it('400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ code: 'invalidCode' })
        .expect(400);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('201', async () => {
      const { refreshTokenCookie } = await createUser();

      KakaoLoginService.logout = jest.fn().mockResolvedValue({
        id: Number(id)
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
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

      await deleteUser();
    });

    it('400', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ code: 'invalidCode' })
        .expect(400);
    });
  });

  describe('/api/auth/token/reissue (POST)', () => {
    it('204', async () => {
      const { refreshTokenCookie } = await createUser();
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

      await deleteUser();
    });

    it('401', () => {
      return request(app.getHttpServer()).post('/api/auth/token/reissue').expect(401);
    });
  });
});
