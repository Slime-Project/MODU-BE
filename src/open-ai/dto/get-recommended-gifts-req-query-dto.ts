import { IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';

import { Age, Character, Gender, Range, Relation } from '@/types/open-ai.type';

export class GetRecommendedGiftsDto {
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsEnum(Age)
  @IsNotEmpty()
  age: Age;

  @IsEnum(Range)
  @IsNotEmpty()
  range: Range;

  @IsEnum(Relation)
  @IsNotEmpty()
  relation: Relation;

  @IsString()
  @IsNotEmpty()
  min: string;

  @IsString()
  @IsNotEmpty()
  max: string;

  @IsEnum(Character)
  @IsNotEmpty()
  character: Character;

  @IsString()
  @IsOptional()
  description?: string;
}
