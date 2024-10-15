import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login-req.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() { code }: LoginReqDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(code);

    res.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: token.exp
    });
    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: token.refreshTokenExp
    });

    return {
      ...user,
      id: user.id.toString()
    };
  }
}
