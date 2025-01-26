import {
  Controller,
  Post,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  Delete,
  HttpCode,
  Get,
  Query
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';

import { FindWishlistCollectionsDto } from './dto/find-wishlist-collections.dto';
import { WishlistCollectionService } from './wishlist-collection.service';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('wishlist-collection')
@ApiTags('wishlist-collection')
export class WishlistCollectionController {
  constructor(private readonly wishlistCollectionService: WishlistCollectionService) {}

  @ApiOperation({
    summary: 'Add a gift collection to user wishlist'
  })
  @ApiResponse({
    status: 201,
    description: 'Created'
    // type:
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Collection not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User has already added this collection to the wishlist'
  })
  @UseGuards(AccessTokenGuard)
  @Post(':collectionId')
  async createWishlistCollection(
    @Req() { id }: TokenGuardReq,
    @Param('collectionId', ParseIntPipe) collectionId: number
  ) {
    const collection = await this.wishlistCollectionService.createWishlistCollection(
      id,
      collectionId
    );

    return collection;
  }

  @ApiOperation({
    summary: 'Remove a collection to user wishlist'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Collection is not present in the wishlist'
  })
  @UseGuards(AccessTokenGuard)
  @Delete(':collectionId')
  @HttpCode(204)
  async deleteWishlistCollection(
    @Req() { id }: TokenGuardReq,
    @Param('collectionId', ParseIntPipe) collectionId: number
  ) {
    await this.wishlistCollectionService.deleteWishlistCollection(id, collectionId);
  }

  @ApiOperation({
    summary: 'Get all paginated collections in wishlist'
  })
  @ApiResponse({
    status: 200,
    description: 'Success'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing query fields'
  })
  @UseGuards(AccessTokenGuard)
  @Get('')
  async findAll(
    @Req() { id }: TokenGuardReq,
    @Query() findWishlistCollectionsDto: FindWishlistCollectionsDto
  ) {
    const collection = await this.wishlistCollectionService.findAll(id, findWishlistCollectionsDto);
    return collection;
  }
}
