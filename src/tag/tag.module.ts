import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { TagService } from './tag.service';

@Module({
  providers: [TagService],
  exports: [TagService],
  imports: [PrismaModule]
})
export class TagModule {}
