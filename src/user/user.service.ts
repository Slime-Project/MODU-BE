import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: User, prisma?: Omit<PrismaClient, ITXClientDenyList>): Promise<User> {
    return (prisma || this.prismaService).user.create({
      data
    });
  }

  async remove(id: bigint): Promise<User> {
    return this.prismaService.user.delete({
      where: { id }
    });
  }

  async findOne(id: bigint): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id }
    });
  }

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
    await this.remove(id);
  }
}
