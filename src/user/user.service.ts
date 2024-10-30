import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: User, prisma?: Omit<PrismaClient, ITXClientDenyList>): Promise<User> {
    return (prisma || this.prismaService).user.create({
      data
    });
  }

  async findOne(id: bigint): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id }
    });
  }
}
