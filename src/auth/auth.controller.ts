import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginReqDto } from './dto/login-req.dto';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

import { RefreshReq } from '@/types/auth.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginReqDto: LoginReqDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.authService.login(loginReqDto);

    const accessTokenExpDate = this.authService.getAccessTokenExpDate();
    const refreshTokenExpDate = this.authService.getRefreshTokenExpDate();

    res.cookie('access_token', data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: accessTokenExpDate
    });
    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: refreshTokenExpDate
    });

    return data.user;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: RefreshReq, @Res({ passthrough: true }) res: Response) {
    const { email } = req.user;
    const refreshToken = req.cookies.refresh_token;
    const tokenData = await this.authService.refresh(email, refreshToken);

    res.cookie('access_token', tokenData.accessToken, { httpOnly: true });

    return tokenData;
  }
}
