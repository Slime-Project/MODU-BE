import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TasksModule } from '@/tasks/tasks.module';
import { TasksService } from '@/tasks/tasks.service';
import { UserService } from '@/user/user.service';

import { CreateAuth } from '@/types/auth.type';

describe('TasksService (integration)', () => {
  let tasksService: TasksService;
  let authService: AuthService;
  let userService: UserService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TasksModule]
    }).compile();

    tasksService = module.get(TasksService);
    authService = module.get(AuthService);
    userService = module.get(UserService);
    prismaService = module.get(PrismaService);
  });

  describe('removeExpiredAuthRecords', () => {
    const id = BigInt(1234567890);

    beforeAll(async () => {
      const auth: CreateAuth = {
        userId: BigInt(1234567890),
        refreshToken: 'refreshToken',
        refreshTokenExp: new Date(Date.now() - 1000),
        kakaoAccessToken: 'kakaoAccessToken',
        kakaoRefreshToken: 'kakaoRefreshToken'
      };
      await userService.create({ id, role: UserRole.USER });
      await authService.create(auth);
      await authService.create({ ...auth, refreshToken: 'anotherRefreshToken' });
    });

    it('should delete expired auth records', async () => {
      await tasksService.removeExpiredAuthRecords();
      const auths = await prismaService.auth.findMany({ where: { userId: id } });
      expect(auths.length).toEqual(0);
    });

    afterAll(() => {
      userService.remove(id);
      // 회원탈퇴 로직에 중복될 수 있음
      prismaService.auth.deleteMany({
        where: {
          userId: id
        }
      });
    });
  });
});
