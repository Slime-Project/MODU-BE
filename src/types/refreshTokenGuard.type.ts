import { Request } from 'express';

interface RefreshTokenGuardReq extends Request {
  id: string;
}

export { RefreshTokenGuardReq };
