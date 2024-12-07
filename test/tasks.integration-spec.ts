import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { TasksModule } from '@/tasks/tasks.module';
import { TasksService } from '@/tasks/tasks.service';

import { CreateAuth } from '@/types/auth.type';

describe('TasksService (integration)', () => {
  let tasksService: TasksService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TasksModule]
    }).compile();

    tasksService = module.get(TasksService);
    prismaService = module.get(PrismaService);
  });

  describe('removeExpiredAuthRecords', () => {
    const id = BigInt(2345678901);

    beforeAll(async () => {
      const auth: CreateAuth = {
        userId: id,
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() - 1000),
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken'
      };
      await prismaService.user.create({ data: { id, role: UserRole.USER } });
      await prismaService.auth.create({ data: auth });
      await prismaService.auth.create({ data: { ...auth, refreshToken: 'anotherRefreshToken' } });
    });

    it('should delete expired auth records', async () => {
      await tasksService.removeExpiredAuthRecords();
      const auths = await prismaService.auth.findMany({ where: { userId: id } });
      expect(auths.length).toEqual(0);
    });

    afterAll(() => {
      prismaService.user.delete({
        where: {
          id
        }
      });
    });
  });
});
