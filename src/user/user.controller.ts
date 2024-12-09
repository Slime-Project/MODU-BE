import { Controller, Delete, HttpCode, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { UserService } from '@/user/user.service';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Delete Account'
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
  @Delete('')
  async deleteAccount(@Req() req: RefreshTokenGuardReq, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refresh_token;
    await this.userService.deleteAccount(BigInt(req.id), refreshToken);

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
