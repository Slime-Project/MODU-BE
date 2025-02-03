import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { WISHLIST_PRODUCTS_PAGE_SIZE } from '@/constants/page';
import { PrismaService } from '@/prisma/prisma.service';
import { calculateSkip, calculateTotalPages } from '@/utils/page';
import { FindWishlistProductsDto } from '@/wishlist/product/dto/find-wishlist-products.dto';

import { WishlistProductsData } from '@/types/wishlist.type';

@Injectable()
export class WishlistProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const wishlistItem = await this.prismaService.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (wishlistItem) {
      throw new ConflictException('User has already added this product to the wishlist');
    }

    const [updatedProduct] = await this.prismaService.$transaction([
      this.prismaService.product.update({
        where: { id: productId },
        data: {
          wishedCount: { increment: 1 }
        }
      }),
      this.prismaService.wishlistItem.create({
        data: {
          userId,
          productId
        }
      })
    ]);

    return { product: updatedProduct };
  }

  async remove(userId: string, productId: number) {
    const wishlistItem = await this.prismaService.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product is not present in the wishlist');
    }

    await this.prismaService.$transaction([
      this.prismaService.product.update({
        where: { id: productId },
        data: {
          wishedCount: { decrement: 1 }
        }
      }),
      this.prismaService.wishlistItem.delete({
        where: {
          userId_productId: { userId, productId }
        }
      })
    ]);
  }

  async findMany(userId: string, findWishlistProductsDto: FindWishlistProductsDto) {
    const products = await this.prismaService.product.findMany({
      where: {
        wishlistItems: {
          some: {
            userId,
            productId: {
              not: null
            }
          }
        }
      },
      take: WISHLIST_PRODUCTS_PAGE_SIZE,
      skip: calculateSkip(findWishlistProductsDto.page, WISHLIST_PRODUCTS_PAGE_SIZE)
    });
    const total = await this.prismaService.product.count({
      where: {
        wishlistItems: {
          some: {
            userId,
            productId: {
              not: null
            }
          }
        }
      }
    });
    const totalPages = calculateTotalPages(total, WISHLIST_PRODUCTS_PAGE_SIZE);
    const wishlistProductsData: WishlistProductsData = {
      products,
      total,
      totalPages,
      pageSize: WISHLIST_PRODUCTS_PAGE_SIZE
    };
    return wishlistProductsData;
  }
}
