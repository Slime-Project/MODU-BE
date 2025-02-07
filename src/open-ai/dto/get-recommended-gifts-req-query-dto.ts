import { IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';

import { Age, Character, Gender, Range } from '@/types/open-ai.type';

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

  @IsNotEmpty()
  @IsString()
  relation: string;

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
