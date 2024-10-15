import { Request } from 'express';

export interface RefreshReq extends Request {
  user: {
    id: bigint;
  };
}

type Token = {
  accessToken: string;
  exp: Date;
  refreshToken?: string;
  refreshTokenExp?: Date;
};

type JwtPayload = {
  id: bigint;
};

export { Token, JwtPayload };
