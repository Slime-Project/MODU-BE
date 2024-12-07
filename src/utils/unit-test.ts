import { Auth } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';

const getMockAuth = () => {
  const auth: Auth = {
    id: 1,
    userId: BigInt(1234567890),
    refreshToken: 'refreshToken',
    kakaoAccessToken: 'kakaoAccessToken',
    kakaoRefreshToken: 'kakaoRefreshToken',
    refreshTokenExp: AuthService.getExpDate(604800000)
  };
  return auth;
};

export { getMockAuth };
