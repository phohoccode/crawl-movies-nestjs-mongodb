import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class TmdbDto {
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

class CategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

class CountryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
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

class EpisodeDto {
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
  tmdb?: TmdbDto;

  @IsNotEmpty()
  @IsString()
  movie_id: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  origin_name?: string;

  @IsOptional()
  @IsBoolean()
  is_cinema: boolean;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  poster_url?: string;

  @IsOptional()
  @IsString()
  thumb_url?: string;

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

  @IsOptional()
  @IsString()
  quality?: string;

  @IsOptional()
  @IsString()
  lang?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

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
  @Type(() => CategoryDto)
  categories?: CategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryDto)
  countries?: CountryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeDto)
  episodes?: EpisodeDto[];
}
