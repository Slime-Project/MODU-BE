import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

import { CreateAuthResDto } from '@/auth/dto/create-auth-res.dto';

import { AuthService } from './auth.service';
import { CreateAuthReqDto } from './dto/create-auth-req.dto';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Signup & Login'
  })
  @ApiResponse({
    status: 201,
    description: 'created',
    type: CreateAuthResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code'
  })
  @Post('/login')
  async login(@Body() { code }: CreateAuthReqDto, @Res({ passthrough: true }) res: Response) {
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

    return plainToInstance(CreateAuthResDto, user);
  }

  @ApiOperation({
    summary: 'Reissue token'
  })
  @ApiResponse({
    status: 204,
    description: 'No Content'
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
  })
  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  @Post('token/reissue')
  async reissueToken(@Req() req: RefreshTokenGuardReq, @Res({ passthrough: true }) res: Response) {
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

  @ApiOperation({
    summary: 'Logout'
  })
  @ApiResponse({
    status: 204,
    description: 'No Content'
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
  })
  @HttpCode(204)
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  async logout(@Req() req: RefreshTokenGuardReq, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refresh_token;
    await this.authService.logout(req.id, refreshToken);

    res.cookie('access_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0)
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(0)
    });
  }
}
