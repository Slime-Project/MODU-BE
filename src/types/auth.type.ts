import { Request } from 'express';

type Token = {
  accessToken: string;
  exp: Date;
  refreshToken?: string;
  refreshTokenExp?: Date;
};

type JwtPayload = {
  id: bigint;
};

type VerifyedJWT = { id: bigint; iat: number; exp: number };

interface AuthReq extends Request {
  id: bigint;
}

export { Token, JwtPayload, VerifyedJWT, AuthReq };
