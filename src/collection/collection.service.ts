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

import { AuthorDto } from '@/common/dto/author.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { S3Service } from '@/s3/s3.service';
import { TagService } from '@/tag/tag.service';
import { UserService } from '@/user/user.service';

import { CollectionResponseDto } from './dto/collection-res.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';

import { CollectionWithImg, UpdateGiftCollection } from '@/types/collection.type';
import { TokenGuardReq } from '@/types/refreshTokenGuard.type';

@Injectable()
export class CollectionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly tagService: TagService,
    private readonly userService: UserService
  ) {}

  private async createImg(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    img: Express.Multer.File
  ): Promise<{
    imgId: number;
    imgUrl: string;
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
        imgId: createdImg.id,
        imgUrl: createdImg.url
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
    console.log(oldFilePath, 'oldFilePath');
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
    refreshToken: string,
    img: Express.Multer.File
  ): Promise<CollectionResponseDto> {
    const { imgId, imgUrl } = await this.createImg(this.prismaService, img);

    const { tags, title, productsId } = createCollectionDto;

    // update or create tags and apply tags to products
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
      data,
      include: {
        products: {
          select: {
            productId: true
          }
        },
        //  products: [
        //     { productId: 5 },
        //     { productId: 6 }
        //   ]
        tags: {
          select: {
            tagId: true
          }
        }
      }
    });

    const createdCollectionWithImg: CollectionWithImg = { ...createdCollection, img: imgUrl };

    const author: AuthorDto = await this.userService.findOne(userId, refreshToken);

    const response = {
      collection: [
        {
          id: createdCollectionWithImg.id,
          title: createdCollectionWithImg.title,
          img: createdCollectionWithImg.img,
          createdAt: createdCollectionWithImg.createdAt,
          updatedAt: createdCollectionWithImg.updatedAt,
          wishedCount: createdCollectionWithImg.wishedCount,
          productsId: createdCollectionWithImg.products.map(p => p.productId),
          tagsId: createdCollectionWithImg.tags.map(p => p.tagId),
          author
        }
      ]
    };
    return response;
  }

  async updateCollection(
    patchCollectionDto: PatchCollectionDto,
    collectionId: number,
    req: TokenGuardReq,
    img?: Express.Multer.File
  ): Promise<CollectionResponseDto> {
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
    // 수정전 collection;
    //     {
    //   id: 2,
    //   userId: '1234',
    //   imgId: 2,
    //   title: '친구 생일선물 추천',
    //   createdAt: 2025-01-06T03:18:51.661Z,
    //   updatedAt: 2025-01-06T03:18:51.661Z,
    //   wishedCount: 0,
    //   img: { filePath: 'collection/4e310205/7.png' },
    //   products: [ { productId: 11 }, { productId: 12 } ],
    //   tags: [ { tag: { "id": 19, "name": "연말" } }, { tag: { "id": 20, "name": "가성비" } } ]
    // }

    let updatedImgUrl;

    if (img) {
      // 기존 이미지 s3에서 삭제 후 새로운 이미지 s3생성 및 giftCollectionImg 업데이트
      updatedImgUrl = await this.updateImg(img, collection.img.filePath, collection.imgId);
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
      data: updateData,
      include: {
        products: {
          select: {
            productId: true
          }
        },
        tags: {
          select: {
            tagId: true
          }
        }
      }
    });
    console.log(updatedCollection, 'updatedCollection');
    //     {
    //   id: 3,
    //   userId: '3861867065',
    //   imgId: 3,
    //   title: '크롱이짱이다',
    //   createdAt: 2025-01-06T05:35:03.405Z,
    //   updatedAt: 2025-01-16T05:51:53.812Z,
    //   wishedCount: 0,
    //   products: [ { productId: 1 }, { productId: 2 } ],
    //   tags: [ { tagId: 19 }, { tagId: 21 } ]
    // }
    const updatedCollectionWithImg: CollectionWithImg = {
      ...updatedCollection,
      img: updatedImgUrl
    };
    const author: AuthorDto = await this.userService.findOne(req.id, req.cookies.refresh_token);

    const response = {
      collection: [
        {
          id: updatedCollectionWithImg.id,
          title: updatedCollectionWithImg.title,
          img: updatedCollectionWithImg.img,
          createdAt: updatedCollectionWithImg.createdAt,
          updatedAt: updatedCollectionWithImg.updatedAt,
          wishedCount: updatedCollectionWithImg.wishedCount,
          productsId: updatedCollectionWithImg.products.map(p => p.productId),
          tagsId: updatedCollectionWithImg.tags.map(p => p.tagId),
          author
        }
      ]
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
          status: 'delete collection success',
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

  async findOne(collectionId: number) {
    // : Promise<CollectionResponseDto>
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

    const collectionData = {
      ...collection,
      img: collection.img.url,
      products: collection.products.map(product => product.product),
      tags: collection.tags.map(tag => tag.tag.name)
    };
    // const author: AuthorDto = await this.userService.findOne(req.id, req.cookies.refresh_token);

    const response = {
      collection: [
        {
          ...collectionData
        }
      ]
    };

    return response;
    //     {
    //     "collection": [
    //         {
    //             "id": 5,
    //             "userId": "3861867065",
    //             "imgId": 5,
    //             "title": "연말가성비선물모음",
    //             "createdAt": "2025-01-17T08:01:25.016Z",
    //             "updatedAt": "2025-01-17T08:01:25.016Z",
    //             "wishedCount": 0,
    //             "img": "https://s3.ap-southeast-2.amazonaws.com/modu-bucket/collection/2a344a69-fd40-4b20-8ee2-3c2c0baf9b2b/ct.png",
    //             "products": [
    //                 {
    //                     "id": 11,
    //                     "title": "[New Frequency] 스탠리 퀜처 H2.0 플로우스테이트 텀블러 1.18L",
    //                     "img": "https://shopping-phinf.pstatic.net/main_8882568/88825680116.2.jpg?type=f300",
    //                     "price": 59000,
    //                     "seller": "스탠리 코리아"
    //                 },
    //                 {
    //                     "id": 1,
    //                     "title": "[우슴] 고급 천연 소이 밀랍 필라 오브제캔들",
    //                     "img": "https://searchad-phinf.pstatic.net/MjAyNDAzMjJfMjcy/MDAxNzExMTA0NzUwOTk4.n9sS0jLC0nGAO65ltrk8v43ZyZ7Ft1Vt0RdK8jj1xhQg.pk0G3KlyvnKSSq4DJMBwUVSiHq9Tdb3QTUWRt-8IiWkg.PNG/2429721-03532fcd-a16d-4fc1-b807-342996a8ab12.png?type=f300",
    //                     "price": 97000,
    //                     "seller": "WOOSM"
    //                 }
    //             ],
    //             "tags": [
    //                 "연말",
    //                 "가성비"
    //             ]
    //         }
    //     ]
    // }
  }

  // async findAll() {}
}
