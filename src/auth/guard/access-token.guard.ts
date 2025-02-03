import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { VerifyedJWT } from '@/types/auth.type';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const { id }: VerifyedJWT = await this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET')
      });
      request.id = id;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
