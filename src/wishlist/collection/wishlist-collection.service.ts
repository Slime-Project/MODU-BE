import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PaginationResponseDto } from '@/common/dto/pagination-res.dto';
import { COLLECTIONS_PAGE_SIZE } from '@/constants/collection';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';
import { calculateHasMore, calculateSkip } from '@/utils/page';

import { FindWishlistCollectionsDto } from './dto/find-wishlist-collections.dto';
import { WishlistCollectionCreateResDto } from './dto/res/create-wishlist-collection-res.dto';
import { WishlistCollectionBaseResDto } from './dto/res/wishlist-collection-base-res.dto';

import { SortOrder } from '@/types/collection.type';

@Injectable()
export class WishlistCollectionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService
  ) {}

  async createWishlistCollection(
    userId: string,
    collectionId: number
  ): Promise<WishlistCollectionCreateResDto> {
    const collection = await this.prismaService.giftCollection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      throw new NotFoundException('Collection not found'); // 404
    }

    const wishlistCollection = await this.prismaService.wishlistItem.findUnique({
      where: {
        userId_giftCollectionId: { userId, giftCollectionId: collectionId }
      }
    });

    if (wishlistCollection) {
      throw new ConflictException('User has already added this collection to the wishlist');
    }

    const result = await this.prismaService.$transaction(async prisma => {
      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          userId,
          giftCollectionId: collectionId
        }
      });

      await prisma.giftCollection.update({
        where: { id: collectionId },
        data: {
          wishedCount: { increment: 1 }
        }
      });

      return wishlistItem;
    });

    return result;
  }

  async deleteWishlistCollection(userId: string, collectionId: number) {
    const wishlistCollection = await this.prismaService.wishlistItem.findUnique({
      where: {
        userId_giftCollectionId: { userId, giftCollectionId: collectionId }
      }
    });

    if (!wishlistCollection) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.prismaService.$transaction([
      this.prismaService.wishlistItem.delete({
        where: {
          userId_giftCollectionId: { userId, giftCollectionId: collectionId }
        }
      }),
      this.prismaService.giftCollection.update({
        where: { id: collectionId },
        data: {
          wishedCount: { decrement: 1 }
        }
      })
    ]);
  }

  async findAll(
    userId: string,
    findWishlistCollectionsDto: FindWishlistCollectionsDto
  ): Promise<PaginationResponseDto<WishlistCollectionBaseResDto>> {
    const { page, sortOrder } = findWishlistCollectionsDto;

    const WishlistCollectionsOrderBy = sortOrderEx => {
      if (sortOrderEx === SortOrder.POPULAR) {
        return { giftCollection: { wishedCount: 'desc' } } as const;
      }
      return { createdAt: sortOrderEx === SortOrder.LATEST ? 'desc' : 'asc' } as const;
    };

    const [collections, totalItems] = await Promise.all([
      this.prismaService.wishlistItem.findMany({
        where: {
          userId,
          giftCollectionId: { not: null }
        },
        skip: calculateSkip(page, COLLECTIONS_PAGE_SIZE),
        take: COLLECTIONS_PAGE_SIZE,
        orderBy: WishlistCollectionsOrderBy(sortOrder),
        include: {
          giftCollection: {
            include: {
              img: {
                select: {
                  url: true
                }
              }
            }
          }
        }
      }),
      this.prismaService.wishlistItem.count({
        where: {
          userId,
          giftCollectionId: { not: null }
        }
      })
    ]);

    const collectionsWithAuthor = await Promise.all(
      collections.map(async collection => {
        const author = await this.userService.findOne(collection.giftCollection.userId);

        return {
          ...collection,
          giftCollection: {
            ...collection.giftCollection,
            img: collection.giftCollection.img.url,
            author
          }
        };
      })
    );
    return {
      items: collectionsWithAuthor,
      meta: {
        currentPage: page,
        hasMore: calculateHasMore(totalItems, page, COLLECTIONS_PAGE_SIZE),
        totalItems
      }
    };
  }
}
