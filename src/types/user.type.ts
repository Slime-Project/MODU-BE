import { User } from '@prisma/client';

type UserInfo = Omit<User, 'role'> & {
  nickname: string;
  profileImg: string;
};

export { UserInfo };
