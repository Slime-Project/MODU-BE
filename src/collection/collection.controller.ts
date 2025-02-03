import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseFilePipe,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  Get,
  Query,
  HttpCode
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/auth/guard/access-token.guard';
import {
  COLLECTION_ALLOWED_MIME_TYPE,
  COLLECTION_IMG_SIZE_LIMIT
} from '@/constants/collection-img';
import { checkFileMimeType } from '@/utils/file';

import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { FindCollectionsDto } from './dto/find-collections.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';
import { CollectionDetailResDto } from './dto/res/collection-detail-res.dto';
import { CollectionsResponseDto } from './dto/res/collections-res.dto';
import { CollectionCreateResDto } from './dto/res/create-collection-res.dto';
import { SearchCollectionsDto } from './dto/search-collections.dto';

import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Controller('collection')
@ApiTags('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @ApiOperation({
    summary: 'Create a gift collection'
  })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: CollectionCreateResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @UseGuards(AccessTokenGuard)
  @Post('')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: COLLECTION_IMG_SIZE_LIMIT
      },
      fileFilter: (_, file: Express.Multer.File, callback) => {
        if (checkFileMimeType(file, COLLECTION_ALLOWED_MIME_TYPE)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only image file with jpeg or png is allowed'), false);
        }
      }
    })
  )
  async createCollection(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true
      })
    )
    img: Express.Multer.File,
    @Req() { id }: TokenGuardReq,
    @Body() createCollectionDto: CreateCollectionDto
  ) {
    const collection = await this.collectionService.createCollection(createCollectionDto, id, img);

    return collection;
  }

  @ApiOperation({
    summary: 'Update a gift collection'
  })
  @ApiResponse({
    status: 201,
    description: 'Updated',
    type: CollectionCreateResDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 408,
    description: 'DB is not connected'
  })
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: COLLECTION_IMG_SIZE_LIMIT
      },
      fileFilter: (_, file: Express.Multer.File, callback) => {
        if (checkFileMimeType(file, COLLECTION_ALLOWED_MIME_TYPE)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only image file with jpeg or png is allowed'), false);
        }
      }
    })
  )
  @Patch('/:collectionId')
  async updateCollection(
    @Req() req: TokenGuardReq,
    @Body() patchCollectionDto: PatchCollectionDto,
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false
      })
    )
    img?: Express.Multer.File
  ) {
    const collection = await this.collectionService.updateCollection(
      patchCollectionDto,
      collectionId,
      req,
      img
    );
    return collection;
  }

  @ApiOperation({
    summary: 'delete a gift collection'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing fields in the request body'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token, or access token is missing'
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 408,
    description: 'DB is not connected'
  })
  @UseGuards(AccessTokenGuard)
  @Delete('/:collectionId')
  @HttpCode(204)
  async deleteCollection(
    @Req() { id }: TokenGuardReq,
    @Param('collectionId', ParseIntPipe) collectionId: number
  ) {
    const response = await this.collectionService.deleteCollection(id, collectionId);
    return response;
  }

  @ApiOperation({
    summary: 'Get all paginated gift collections'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: CollectionsResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing query fields'
  })
  @Get('')
  async findAll(@Query() findCollectionsDto: FindCollectionsDto) {
    const collection = await this.collectionService.findAll(findCollectionsDto);
    return collection;
  }

  @ApiOperation({
    summary: 'Get paginated gift collections searched by title'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: CollectionsResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing query fields'
  })
  @Get('search')
  async searchCollection(@Query() searchCollectionsDto: SearchCollectionsDto) {
    const collections = await this.collectionService.searchCollection(searchCollectionsDto);
    return collections;
  }

  @ApiOperation({
    summary: 'Get a gift collection'
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: CollectionDetailResDto
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @Get('/:collectionId')
  async findOne(@Param('collectionId', ParseIntPipe) collectionId: number) {
    const collection = await this.collectionService.findOne(collectionId);
    return collection;
  }
}
