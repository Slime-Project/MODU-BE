import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '@/prisma/prisma.module';
import { S3Module } from '@/s3/s3.module';
import { TagModule } from '@/tag/tag.module';
import { UserModule } from '@/user/user.module';

import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';

@Module({
  controllers: [CollectionController],
  providers: [CollectionService],
  imports: [JwtModule, ConfigModule, PrismaModule, S3Module, TagModule, UserModule]
})
export class CollectionModule {}
