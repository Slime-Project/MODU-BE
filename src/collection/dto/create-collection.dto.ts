import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, IsInt, MaxLength, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({
    example: 'Best 10 Gifts for teenager Birthday!!ß'
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @MaxLength(64)
  title: string;

  @ApiPropertyOptional({
    description: 'Array of id of products',
    example: [1, 2]
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  productsId: number[];

  @ApiPropertyOptional({
    description: 'Array of tags(string)',
    example: ['집들이 선물', '가성비']
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
