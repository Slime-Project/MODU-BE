import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { CollectionItemDto } from './collection-item.dto';

export class CollectionResponseDto {
  @ApiProperty({
    description: 'Array of collections',
    type: [CollectionItemDto],
    isArray: true
  })
  @ValidateNested({ each: true })
  @Type(() => CollectionItemDto)
  collection: CollectionItemDto[];
}

// {
//     "collection": [
//         {
//             "id": String,
//             "title": String,
//             "img": String,
//             "createdAt": String,
//             "updateddAt": String,
//             "wishedCount": Number,
//             "productsId": Number[],
//             "tagsId": Number[],
//             "author": {
//                 "userId": "작성자 userId",
//                 "role": "작성자 role",
//                 "nickname": "작성자 nickname",
//                 "profileImg": "작성자 profileImg"
//             }
//         }
//     ]
// }
