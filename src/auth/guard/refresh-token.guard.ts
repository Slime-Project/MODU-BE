import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest();
      const refreshToken = request.cookies.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedException('You need to log in first');
      }

      await this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET')
      });
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
