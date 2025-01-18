import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrCreateTag(name: string): Promise<number> {
    // 태그 id 바로 가져오거나 태그 생성 후 id 가져옴
    const tag = await this.prismaService.tag.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    return tag.id;
  }

  async getTagsId(names: string[]): Promise<number[]> {
    const tagIds = await Promise.all(names.map(name => this.getOrCreateTag(name)));
    return tagIds;
  }

  async applyTagsToProducts(productsId: number[], tagIds: number[]) {
    await this.prismaService.productTag.createMany({
      data: tagIds.flatMap(tagId =>
        productsId.map(productId => ({
          productId,
          tagId
        }))
      ),
      skipDuplicates: true
    });
  }
}
