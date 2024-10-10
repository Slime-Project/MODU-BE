import { Request } from 'express';

export interface RefreshReq extends Request {
  user: {
    email: string;
  };
}
