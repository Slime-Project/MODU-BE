import { Injectable, UnauthorizedException } from '@nestjs/common';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

import { UserInfo } from '@/types/user.type';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly kakaoLoginService: KakaoLoginService
  ) {}

  async remove(id: string, refreshToken: string) {
    const auth = await this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId: id,
          refreshToken
        }
      }
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await KakaoLoginService.unlink(auth.kakaoAccessToken);
    await this.prismaService.$transaction(async prisma => {
      const productIds = await prisma.wishlistItem.findMany({
        where: { userId: id },
        select: { productId: true }
      });
      await prisma.user.delete({
        where: { id }
      });
      await Promise.all(
        productIds.map(({ productId }) =>
          this.prismaService.product.update({
            where: { id: productId },
            data: {
              wishedCount: { decrement: 1 }
            }
          })
        )
      );
    });
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    const kakaoUserInfo = await this.kakaoLoginService.getUserInfo(parseInt(id));
    const userInfo: UserInfo = {
      ...user,
      ...kakaoUserInfo
    };
    return userInfo;
  }

  async findMany(ids: string[]) {
    const users = await this.prismaService.user.findMany({ where: { id: { in: ids } } });
    const kakaoUsersInfo = await this.kakaoLoginService.findUsers(ids.map(id => parseInt(id)));
    // kakaoUsersInfo 순서가 요청 순서와 동일한지 검증하기
    const usersInfo: UserInfo[] = users.map((user, i) => ({ ...user, ...kakaoUsersInfo[i] }));
    return usersInfo;
  }
}
