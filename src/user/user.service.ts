import { Injectable, UnauthorizedException } from '@nestjs/common';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

import { UserInfo } from '@/types/user.type';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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

  async findOne(id: string, refreshToken: string) {
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

    const kakaoUserInfo = await KakaoLoginService.getUserInfo(auth.kakaoAccessToken);
    const userInfo: UserInfo = {
      id,
      nickname: kakaoUserInfo.properties.nickname,
      profileImage: kakaoUserInfo.properties.profileImage
    };
    return userInfo;
  }
}
