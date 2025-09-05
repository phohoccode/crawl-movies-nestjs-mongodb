import { IsIn, IsNotEmpty, IsOptional, Max } from 'class-validator';
import { MOVIE_TYPE } from '../constants/movie.contant';
import { Type } from 'class-transformer';

export class GetMoviesDto {
  @IsNotEmpty({ message: 'Type is required' })
  @IsIn(MOVIE_TYPE, {
    message: `Type phải là một trong: ${MOVIE_TYPE.join(', ')}`,
  })
  type: string;

  @IsOptional()
  // @Type(() => Number)
  @Max(64, { message: 'Limit tối đa là 64' })
  limit?: number;

  @IsOptional()
  // @Type(() => Number)
  page?: number;
}
