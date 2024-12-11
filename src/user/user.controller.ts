import { Controller, Delete, Get, HttpCode, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { GetUserResDto } from '@/user/dto/get-user-res.dto';
import { UserService } from '@/user/user.service';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get Profile'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetUserResDto
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
  })
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  @Get('')
  async get(@Req() req: RefreshTokenGuardReq) {
    const user = await this.userService.get(req.id, req.cookies.refresh_token);
    return plainToInstance(GetUserResDto, user);
  }

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
    await this.userService.deleteAccount(req.id, refreshToken);

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
