import { User } from '@prisma/client';

type Profile = {
  nickname: string;
  profileImg: string;
};

type UserInfo = User & Profile;

export { Profile, UserInfo };
