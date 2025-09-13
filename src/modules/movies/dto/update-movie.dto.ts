import {
  IsString,
  IsBooleanString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TmdbDto, EpisodeDto } from './create-movie.dto';
import { Category, Country } from '../types/movie.type';

export class UpdateMovieDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TmdbDto)
  tmdb?: TmdbDto;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  origin_name?: string;

  @IsOptional()
  @IsBooleanString()
  is_cinema?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBooleanString()
  sub_docquyen?: string;

  @IsOptional()
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
  @IsString({ each: true })
  categories?: Category[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: Country[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeDto)
  episodes?: EpisodeDto[];
}

export class ParamsUpdateMovie {
  @IsMongoId({ message: 'id không đúng định dạng' })
  id: string;
}
