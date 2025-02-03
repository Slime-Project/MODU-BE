import { PartialType } from '@nestjs/swagger';

import { CreateCollectionDto } from './create-collection.dto';

export class PatchCollectionDto extends PartialType(CreateCollectionDto) {}
