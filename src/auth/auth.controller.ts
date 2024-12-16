import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

import { LoginResDto } from '@/auth/dto/login-res.dto';
import { AccessTokenGuard } from '@/auth/guard/access-token.guard';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Signup & Login'
  })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: LoginResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Unauthorized - Invalid code'
  })
  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(loginDto);

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

    return plainToInstance(LoginResDto, user);
  }

  @ApiOperation({
    summary: 'Reissue token',
    description:
      'Reissues access and refresh tokens. Refresh token reissued based on remaining expiration time.'
  })
  @ApiResponse({
    status: 204,
    description: 'No Content'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token, or login required'
  })
  @UseGuards(RefreshTokenGuard)
  @HttpCode(204)
  @Post('token/reissue')
  async reissueToken(@Req() req: TokenGuardReq, @Res({ passthrough: true }) res: Response) {
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
    description: 'Unauthorized - Invalid or expired token, or token is missing'
  })
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  async logout(@Req() req: TokenGuardReq, @Res({ passthrough: true }) res: Response) {
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
