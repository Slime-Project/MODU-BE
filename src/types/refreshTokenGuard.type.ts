import { Request } from 'express';

interface TokenGuardReq extends Request {
  id: string;
}

export { TokenGuardReq };
