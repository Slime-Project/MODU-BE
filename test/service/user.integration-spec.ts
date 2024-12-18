import { Test } from '@nestjs/testing';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

import { CreateAuth } from '@/types/auth.type';

describe('UserService (integration)', () => {
  let service: UserService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService]
    }).compile();

    service = module.get(UserService);
    prismaService = module.get(PrismaService);
  });

  describe('remove', () => {
    const userId = '6';
    const refreshToken = 'refresh-token';
    let productId: number;

    beforeAll(async () => {
      const createAuth: CreateAuth = {
        userId,
        refreshToken,
        refreshTokenExp: new Date(),
        kakaoAccessToken: 'kakao-access-token',
        kakaoRefreshToken: 'kakao-refresh-token'
      };
      const [{ id }] = await Promise.all([
        prismaService.product.create({
          data: {
            title: 'title',
            link: 'url',
            price: 20000,
            seller: '네이버',
            wishedCount: 1
          }
        }),
        prismaService.user.create({
          data: { id: userId }
        })
      ]);
      productId = id;
      await Promise.all([
        prismaService.wishlistItem.create({
          data: { userId, productId }
        }),
        prismaService.auth.create({
          data: createAuth
        })
      ]);
    });

    it("Should decrement wishedCount for products in the user's wishlist", async () => {
      KakaoLoginService.unlink = jest.fn();
      await service.remove(userId, refreshToken);
      const { wishedCount } = await prismaService.product.findUnique({
        where: {
          id: productId
        },
        select: { wishedCount: true }
      });
      expect(wishedCount).toEqual(0);
    });

    afterAll(async () => {
      await prismaService.product.delete({
        where: {
          id: productId
        }
      });
    });
  });
});
