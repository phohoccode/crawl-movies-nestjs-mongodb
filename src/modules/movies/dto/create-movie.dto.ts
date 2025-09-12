import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsIn,
  IsBooleanString,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Category, Country } from '../types/movie.type';
import { CategoriesArray, CountriesArray } from '../constants/movie.contant';

export class TmdbDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  season?: number;

  @IsOptional()
  @IsNumber()
  vote_average?: number;

  @IsOptional()
  @IsNumber()
  vote_count?: number;
}

export class CategoryInputDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsIn(CategoriesArray, {
    message: `slug must be one of the following values: ${CategoriesArray.join(
      ', ',
    )}`,
  })
  @IsString()
  slug: Category;
}

export class CategoryDto extends CategoryInputDto {
  @IsString()
  id: string;
}

export class CountryInputDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsIn(CountriesArray, {
    message: `slug must be one of the following values: ${CountriesArray.join(
      ', ',
    )}`,
  })
  @IsString()
  slug: Country;
}

export class CountryDto extends CountryInputDto {
  @IsString()
  id: string;
}

class EpisodeDataDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  link_embed?: string;

  @IsOptional()
  @IsString()
  link_m3u8?: string;
}

export class EpisodeDto {
  @IsOptional()
  @IsString()
  server_name?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EpisodeDataDto)
  server_data?: EpisodeDataDto[];
}

export class CreateMovieDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TmdbDto)
  tmdb: TmdbDto;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  origin_name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  poster_url: string;

  @IsNotEmpty()
  @IsString()
  thumb_url: string;

  @IsNotEmpty()
  @IsString()
  quality: string;

  @IsNotEmpty()
  @IsString()
  lang: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  year: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryInputDto)
  categories: CategoryInputDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryInputDto)
  countries: CountryInputDto[];

  @IsOptional()
  @IsBooleanString()
  is_cinema: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBooleanString()
  sub_docquyen?: string;

  @IsOptional()
  @IsString()
  trailer_url?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  episode_current?: string;

  @IsOptional()
  @IsString()
  episode_total?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  directors?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeDto)
  episodes?: EpisodeDto[];
}
