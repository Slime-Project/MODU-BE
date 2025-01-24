import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  RequestTimeoutException
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

import { COLLECTIONS_PAGE_SIZE } from '@/constants/collection';
import { KakaoLoginService } from '@/kakao/login/kakao-login.service';
import { PrismaService } from '@/prisma/prisma.service';
import { S3Service } from '@/s3/s3.service';
import { TagService } from '@/tag/tag.service';
import { UserService } from '@/user/user.service';
import { getOrderBy } from '@/utils/collection';

import { CreateCollectionDto } from './dto/create-collection.dto';
import { FindCollectionsDto } from './dto/find-collections.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';
import { CollectionDetailResDto } from './dto/res/collection-detail-res.dto';
import { CollectionsResponseDto } from './dto/res/collections-res.dto';
import { CollectionCreateResDto } from './dto/res/create-collection-res.dto';
import { SearchCollectionsDto } from './dto/search-collections.dto';

import { UpdateGiftCollection } from '@/types/collection.type';
import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly tagService: TagService,
    private readonly userService: UserService,
    private readonly kakaoLoginService: KakaoLoginService
  ) {}

  private async createImg(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    img: Express.Multer.File
  ): Promise<{
    imgId: number;
  }> {
    const ext = img.originalname.split('.').pop();
    const uniqueId = uuidv4();
    const filePath = `collection/${uniqueId}/${img.originalname}`;
    const url = await this.s3Service.uploadImgToS3(filePath, img, ext);

    try {
      const createdImg = await prisma.giftCollectionImg.create({
        data: {
          url,
          filePath
        }
      });
      return {
        imgId: createdImg.id
      };
    } catch (error) {
      await this.s3Service.deleteImgFromS3(filePath);
      throw error;
    }
  }

  private async updateImg(newImg: Express.Multer.File, oldFilePath: string, imgId: number) {
    const ext = newImg.originalname.split('.').pop();
    const uniqueId = uuidv4();
    const filePath = `collection/${uniqueId}/${newImg.originalname}`;
    // 새 이미지 s3 생성
    const url = await this.s3Service.uploadImgToS3(filePath, newImg, ext);

    // 기존 이미지 s3 삭제
    try {
      await this.s3Service.deleteImgFromS3(oldFilePath);
    } catch (error) {
      throw new HttpException(
        `Failed to delete old image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // 새로운 이미지 update
    const updatedImg = await this.prismaService.giftCollectionImg.update({
      where: { id: imgId },
      data: {
        url,
        filePath
      }
    });

    return {
      imgUrl: updatedImg.url
    };
  }

  async createCollection(
    createCollectionDto: CreateCollectionDto,
    userId: string,
    img: Express.Multer.File
  ): Promise<CollectionCreateResDto> {
    const { imgId } = await this.createImg(this.prismaService, img);

    const { tags, title, productsId } = createCollectionDto;

    // update or create tags
    const tagsId = await this.tagService.getTagsId(tags);

    const data: Prisma.GiftCollectionCreateInput = {
      title,
      user: {
        connect: {
          id: userId
        }
      },
      img: {
        connect: {
          id: imgId
        }
      },
      products: {
        createMany: {
          data: productsId.map(productId => ({ productId }))
        }
        //     [
        //     { productId: 1 },  // GiftCollectionProduct 테이블에 레코드 생성
        //     { productId: 2 },
        //   ]
      },
      tags: {
        createMany: {
          data: tagsId.map(tagId => ({ tagId }))
        }
      }
    };

    const createdCollection = await this.prismaService.giftCollection.create({
      data
    });

    const response = {
      id: createdCollection.id,
      status: 201
    };
    return response;
  }

  async updateCollection(
    patchCollectionDto: PatchCollectionDto,
    collectionId: number,
    req: TokenGuardReq,
    img?: Express.Multer.File
  ): Promise<CollectionCreateResDto> {
    let collection;

    try {
      // collection 찾기
      collection = await this.prismaService.giftCollection.findUnique({
        where: { id: collectionId },
        include: {
          img: {
            select: {
              filePath: true
            }
          },
          // products
          products: {
            select: {
              productId: true
            }
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      throw new RequestTimeoutException('db is not connected'); // 408
    }

    // console.log(collection, 'collection before updated');
    if (!collection) {
      throw new NotFoundException('Collection not found'); // 404
    }

    if (req.id !== collection.userId) {
      throw new ForbiddenException('You are not authorized to update this collection');
    }

    if (img) {
      // 기존 이미지 s3에서 삭제 후 새로운 이미지 s3생성 및 giftCollectionImg 업데이트
      await this.updateImg(img, collection.img.filePath, collection.imgId);
    }

    // this.prismaService.giftCollection.update 해야함
    const updateData: UpdateGiftCollection = {};
    const initialProducts = collection.products.map(product => product.productId); // [11,12]
    const initialTags = collection.tags.map(el => el.tag.name); // ["연말","가성비"]

    if ('title' in patchCollectionDto) {
      updateData.title = patchCollectionDto.title;
    }

    if ('tags' in patchCollectionDto) {
      const removedTags = initialTags.filter(tag => !patchCollectionDto.tags.includes(tag));
      const newTags = patchCollectionDto.tags.filter(tag => !initialTags.includes(tag));

      updateData.tags = {};
      if (removedTags.length > 0) {
        const removedTagsId = await this.tagService.getTagsId(removedTags);
        updateData.tags.deleteMany = {
          tagId: {
            in: removedTagsId
          }
        };
      }
      if (newTags.length > 0) {
        const newTagsId = await this.tagService.getTagsId(newTags);
        updateData.tags.create = newTagsId.map(tagId => ({
          tagId
        }));
      }
    }

    if ('productsId' in patchCollectionDto) {
      const removedProductsId = initialProducts.filter(
        productId => !patchCollectionDto.productsId.includes(productId)
      );
      const newProductsId = patchCollectionDto.productsId.filter(
        productId => !initialProducts.includes(productId)
      );
      updateData.products = {};
      if (removedProductsId.length > 0) {
        updateData.products.deleteMany = {
          productId: {
            in: removedProductsId
          }
        };
      }
      if (newProductsId.length > 0) {
        updateData.products.create = newProductsId.map(productId => ({
          productId
        }));
      }
    }

    const updatedCollection = await this.prismaService.giftCollection.update({
      where: { id: collectionId },
      data: updateData
    });

    const response = {
      id: updatedCollection.id,
      status: 201
    };
    return response;
  }

  async deleteCollection(id: string, collectionId: number) {
    let collection;

    try {
      // collection 찾기
      collection = await this.prismaService.giftCollection.findUnique({
        where: { id: collectionId },
        include: {
          img: {
            select: {
              filePath: true
            }
          }
        }
      });
    } catch (error) {
      throw new RequestTimeoutException('db is not connected'); // 408
    }

    if (!collection) {
      throw new NotFoundException('Collection not found'); // 404
    }

    if (id !== collection.userId) {
      throw new ForbiddenException('You are not authorized to update this collection');
    }

    try {
      return await this.prismaService.$transaction(async prisma => {
        // S3 이미지 삭제
        await this.s3Service.deleteImgFromS3(collection.img.filePath);

        // Collection 삭제
        await prisma.giftCollection.delete({
          where: {
            id: collectionId
          }
        });

        // giftCollectionImg 이미지 data 삭제
        await prisma.giftCollectionImg.delete({
          where: { id: collection.imgId }
        });

        return {
          status: 200,
          message: `Collection (ID: ${collectionId}) has been successfully deleted`
        };
      });
    } catch (error) {
      throw new HttpException(
        `Failed to delete collection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findOne(collectionId: number): Promise<CollectionDetailResDto> {
    const collection = await this.prismaService.giftCollection.findUnique({
      where: { id: collectionId },
      include: {
        img: {
          select: {
            url: true
          }
        },
        // products
        products: {
          select: {
            product: {
              select: {
                id: true,
                title: true,
                img: true,
                price: true,
                seller: true
              }
            }
          }
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    const author = await this.userService.findOne(collection.userId);

    const collectionData = {
      ...collection,
      img: collection.img.url,
      products: collection.products.map(product => product.product),
      tags: collection.tags.map(tag => tag.tag.name),
      author
    };

    return collectionData;
  }

  async findAll(findCollectionsDto: FindCollectionsDto): Promise<CollectionsResponseDto> {
    const { page, sortOrder } = findCollectionsDto;
    const skip = (page - 1) * COLLECTIONS_PAGE_SIZE;

    const [collections, totalItems] = await Promise.all([
      this.prismaService.giftCollection.findMany({
        skip,
        take: COLLECTIONS_PAGE_SIZE,
        orderBy: getOrderBy(sortOrder),
        include: {
          img: {
            select: {
              url: true
            }
          }
        }
      }),
      this.prismaService.giftCollection.count()
    ]);

    const collectionsWithAuthor = await Promise.all(
      collections.map(async collection => {
        const author = await this.userService.findOne(collection.userId);

        return {
          ...collection,
          img: collection.img.url,
          author
        };
      })
    );

    const hasMore = totalItems - page * COLLECTIONS_PAGE_SIZE > 0;

    return {
      items: collectionsWithAuthor,
      meta: {
        currentPage: page,
        hasMore,
        totalItems
      }
    };
  }

  async searchCollection(
    searchCollectionsDto: SearchCollectionsDto
  ): Promise<CollectionsResponseDto> {
    const { keyword, page, sortOrder } = searchCollectionsDto;

    let searchCondition;

    if (keyword.startsWith('#')) {
      // 태그 기반 검색
      const tagName = keyword.slice(1);
      searchCondition = {
        tags: {
          some: {
            // tags 들 중 하나라도
            tag: {
              name: {
                contains: tagName,
                mode: 'insensitive'
              }
            }
          }
        }
      };
    } else {
      // 타이틀 기반 검색
      const keywordsArr = keyword.trim().split(/\s+/);
      searchCondition = {
        OR: keywordsArr.map(word => ({
          title: {
            contains: word,
            mode: 'insensitive'
          }
        }))
      };
    }

    const skip = (page - 1) * COLLECTIONS_PAGE_SIZE;

    const [searchedCollections, totalItems] = await Promise.all([
      this.prismaService.giftCollection.findMany({
        where: searchCondition,
        skip,
        take: COLLECTIONS_PAGE_SIZE,
        orderBy: getOrderBy(sortOrder),
        include: {
          img: {
            select: {
              url: true
            }
          }
        }
      }),
      this.prismaService.giftCollection.count({
        where: searchCondition
      })
    ]);

    const collectionsWithAuthor = await Promise.all(
      searchedCollections.map(async collection => {
        const author = await this.userService.findOne(collection.userId);

        return {
          ...collection,
          img: collection.img.url,
          author
        };
      })
    );

    const hasMore = totalItems - page * COLLECTIONS_PAGE_SIZE > 0;

    return {
      items: collectionsWithAuthor,
      meta: {
        currentPage: page,
        hasMore,
        totalItems
      }
    };
  }
}
