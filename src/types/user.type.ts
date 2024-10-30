import { User } from '@prisma/client';

type Profile = User & {
  nickname: string;
  profileImage: string;
};

export { Profile };
