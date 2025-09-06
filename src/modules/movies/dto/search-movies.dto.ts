import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchMoviesDto {
  @IsString({ message: 'Slug phải là chuỗi' })
  @IsNotEmpty({ message: 'Keyword không được để trống' })
  keyword: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(64, { message: 'Limit tối đa là 64' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  page?: number;
}
