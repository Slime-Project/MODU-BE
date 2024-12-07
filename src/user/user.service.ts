import { Injectable } from '@nestjs/common';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async deleteAccount(id: bigint, refreshToken: string) {
    const auth = await this.prismaService.auth.findUnique({
      where: {
        userId_refreshToken: {
          userId: id,
          refreshToken
        }
      }
    });
    await KakaoLoginService.unlink(auth.kakaoAccessToken);
    await this.prismaService.user.delete({
      where: { id }
    });
  }
}
