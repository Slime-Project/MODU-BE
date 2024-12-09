import { Auth } from '@prisma/client';

type CreateAuth = Omit<Auth, 'id'>;

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
  JwtPayload,
  VerifyedJWT,
  TokensInfo,
  AccessTokenInfo,
  RefreshTokenInfo,
  ReissuedToken
};
