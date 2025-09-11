import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  CategoriesArray,
  CountriesArray,
  LanguagesArray,
} from '../constants/movie.contant';

export class SearchMoviesDto {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(64, { message: 'Limit tối đa là 64' })
  limit: number = 24;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  page: number = 1;

  @IsOptional()
  @IsIn(LanguagesArray, {
    message: 'Sort language không hợp lệ',
  })
  sort_lang?: string;

  @IsOptional()
  @IsIn(CategoriesArray, { message: 'Thể loại phim không hợp lệ' })
  category?: string;

  @IsOptional()
  @IsIn(CountriesArray, { message: 'Quốc gia không hợp lệ' })
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Năm phải là một số nguyên' })
  year?: number | '';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Sort type không hợp lệ' })
  sort_type?: string = 'desc';
}
