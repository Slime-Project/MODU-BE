import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '@/user/user.module';

import { WishlistCollectionController } from './wishlist-collection.controller';
import { WishlistCollectionService } from './wishlist-collection.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule, UserModule],
  providers: [WishlistCollectionService],
  controllers: [WishlistCollectionController]
})
export class WishlistCollectionModule {}
