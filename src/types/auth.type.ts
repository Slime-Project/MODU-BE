type Token = {
  accessToken: string;
  exp: Date;
  refreshToken?: string;
  refreshTokenExp?: Date;
};

type JwtPayload = {
  id: bigint;
};

type DecodedJWT = { id: bigint; iat: number; exp: number };

export { Token, JwtPayload, DecodedJWT };
