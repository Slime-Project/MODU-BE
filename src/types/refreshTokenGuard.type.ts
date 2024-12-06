import { Request } from 'express';

interface RefreshTokenGuardReq extends Request {
  id: number;
}

export { RefreshTokenGuardReq };
