import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

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
          likedCount: { increment: 1 }
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
          likedCount: { decrement: 1 }
        }
      }),
      this.prismaService.wishlistItem.delete({
        where: {
          userId_productId: { userId, productId }
        }
      })
    ]);
  }
}
