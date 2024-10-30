import { Request } from 'express';

type JwtPayload = {
  id: number;
};

type VerifyedJWT = { id: number; iat: number; exp: number };

interface AuthReq extends Request {
  id: bigint;
}

type AccessTokenInfo = { accessToken: string; exp: Date };
type RefreshTokenInfo = { refreshToken: string; refreshTokenExp: Date };
type TokensInfo = AccessTokenInfo & RefreshTokenInfo;
type ReissuedToken = AccessTokenInfo & Partial<RefreshTokenInfo>;

export {
  JwtPayload,
  VerifyedJWT,
  AuthReq,
  TokensInfo,
  AccessTokenInfo,
  RefreshTokenInfo,
  ReissuedToken
};
