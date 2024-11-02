import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';

import { AuthService } from './auth.service';
import { CreateAuthReqDto } from './dto/create-auth-req.dto';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

import { ReissueTokenReq } from '@/types/auth.type';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Signup & Login'
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    type: CreateAuthResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code'
  })
  @Post('')
  async create(@Body() { code }: CreateAuthReqDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.create(code);

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

    const body: CreateAuthResDto = { id: Number(user.id) };
    return body;
  }

  @ApiOperation({
    summary: 'Reissue token'
  })
  @ApiResponse({
    status: 204,
    description: 'success'
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
  })
  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  @Post('token/reissue')
  async reissueToken(@Req() req: ReissueTokenReq, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refresh_token;
    const data = await this.authService.reissueToken(refreshToken, req.id);

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
