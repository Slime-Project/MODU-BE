import { User } from '@prisma/client';

type UserInfo = Omit<User, 'role'> & {
  nickname: string;
  profileImage: string;
};

export { UserInfo };
