import { Auth } from '@prisma/client';
import { Request } from 'express';

type CreateAuth = Omit<Auth, 'id'>;

interface ReissueTokenReq extends Request {
  id: number;
}
interface LogoutReq extends Request {
  id: number;
}

type JwtPayload = {
  id: number;
};
type VerifyedJWT = { id: number; iat: number; exp: number };

type AccessTokenInfo = { accessToken: string; exp: Date };
type RefreshTokenInfo = { refreshToken: string; refreshTokenExp: Date };
type TokensInfo = AccessTokenInfo & RefreshTokenInfo;
type ReissuedToken = AccessTokenInfo & Partial<RefreshTokenInfo>;

export {
  CreateAuth,
  ReissueTokenReq,
  JwtPayload,
  VerifyedJWT,
  TokensInfo,
  AccessTokenInfo,
  RefreshTokenInfo,
  ReissuedToken,
  LogoutReq
};
