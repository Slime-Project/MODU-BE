import { Auth } from '@prisma/client';

type CreateAuth = Omit<Auth, 'id'>;
type UpdateAuth = {
  refreshToken?: string;
  refreshTokenExp?: Date;
  kakaoAccessToken: string;
  kakaoRefreshToken?: string;
};

type JwtPayload = {
  id: string;
};
type VerifyedJWT = { id: string; iat: number; exp: number };

type AccessTokenInfo = { accessToken: string; exp: Date };
type RefreshTokenInfo = { refreshToken: string; refreshTokenExp: Date };
type TokensInfo = AccessTokenInfo & RefreshTokenInfo;
type ReissuedToken = AccessTokenInfo & Partial<RefreshTokenInfo>;

export {
  CreateAuth,
  UpdateAuth,
  JwtPayload,
  VerifyedJWT,
  TokensInfo,
  AccessTokenInfo,
  RefreshTokenInfo,
  ReissuedToken
};
