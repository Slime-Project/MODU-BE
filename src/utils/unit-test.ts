import { Auth, Review } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';

const getMockAuth = () => {
  const auth: Auth = {
    id: 1,
    userId: '1234567890',
    refreshToken: 'refreshToken',
    kakaoAccessToken: 'kakaoAccessToken',
    kakaoRefreshToken: 'kakaoRefreshToken',
    refreshTokenExp: AuthService.getExpDate(604800000)
  };
  return auth;
};

const getMockReview = () => {
  const review: Review = {
    id: 1,
    productId: 1,
    userId: '1234567890',
    text: '',
    rating: 2,
    createdAt: new Date()
  };
  return review;
};

export { getMockAuth, getMockReview };
