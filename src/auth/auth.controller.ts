import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login-req.dto';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

import { RefreshReq } from '@/types/auth.type';

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

  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  @Post('refresh')
  async refresh(@Req() req: RefreshReq, @Res({ passthrough: true }) res: Response) {
    const { id } = req.user;
    const refreshToken = req.cookies.refresh_token;
    const data = await this.authService.refresh(id, refreshToken);

    res.cookie('access_token', data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: data.exp
    });

    if (data.refreshToken) {
      res.cookie('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: data.refreshTokenExp
      });
    }
  }
}
