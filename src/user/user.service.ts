import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(user: User): Promise<User> {
    return this.prismaService.user.create({
      data: user
    });
  }

  async findOne(id: bigint): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id }
    });
  }
}
