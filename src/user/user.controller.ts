import { Controller, Delete, Get, HttpCode, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

import { RefreshTokenGuard } from '@/auth/guard/refresh-token.guard';
import { FindUserResDto } from '@/user/dto/find-user-res.dto';
import { UserService } from '@/user/user.service';

import { RefreshTokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get User Information'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: FindUserResDto
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token, or login required'
  })
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  @Get('')
  async findOne(@Req() req: RefreshTokenGuardReq) {
    const user = await this.userService.findOne(req.id, req.cookies.refresh_token);
    return plainToInstance(FindUserResDto, user);
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
  async delete(@Req() req: RefreshTokenGuardReq, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refresh_token;
    await this.userService.delete(req.id, refreshToken);

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
