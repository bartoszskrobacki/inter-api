import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MealDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  additionals?: string;

  @IsNumber()
  price: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals: MealDto[];
}
