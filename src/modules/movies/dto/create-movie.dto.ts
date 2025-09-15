import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsBooleanString,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Category, Country } from '../types/movie.type';
export class TmdbDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  type?: string;

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

class EpisodeDataDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  @IsOptional()
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
  @IsString({ each: true })
  categories: Category[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  countries: Country[];

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
