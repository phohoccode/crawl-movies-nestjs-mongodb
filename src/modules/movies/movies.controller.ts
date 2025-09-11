import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';

import { GetMoviesDto } from './dto/get-movies.dto';
import { GetMovieBySlugDto } from './dto/get-movie-by-slug.dto';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { MovieType } from './types/movie.type';
import { QueryBasicDto } from './dto/query-basic.dto';
import { ParamsUpdateMovie, UpdateMovieDto } from './dto/update-movie.dto';
import { DeleteMoviesDto } from './dto/delete-movies.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('stats')
  async getMoviesStats() {
    return await this.moviesService.getMoviesStats();
  }

  @Get('search')
  async searchMovies(@Query() searchMovieDto: SearchMoviesDto) {
    return this.moviesService.searchMovies(searchMovieDto);
  }

  @Get(':type')
  async getMovies(
    @Param() params: GetMoviesDto,
    @Query() query: QueryBasicDto,
  ) {
    return this.moviesService.getMovies(
      params.type as MovieType,
      +(query?.limit || 10),
      +(query?.page || 1),
    );
  }

  @Get('info/:slug')
  async getMovieBySlug(@Param() getMovieBySlugDto: GetMovieBySlugDto) {
    return this.moviesService.getMovieBySlug(getMovieBySlugDto.slug);
  }

  @Get('year/:year')
  async getMoviesByYear(
    @Param('year') year: string,
    @Query() query: QueryBasicDto,
  ) {
    return this.moviesService.getMoviesByYear(
      year,
      +(query?.limit || 10),
      +(query?.page || 1),
    );
  }

  @Patch(':id')
  async updateInfoMovie(
    @Param() params: ParamsUpdateMovie,
    @Body() dataUpdate: UpdateMovieDto,
  ) {
    return await this.moviesService.updateInfoMovieById(params.id, dataUpdate);
  }

  @Delete()
  async deleteMovies(@Body() deleteMoviesDto: DeleteMoviesDto) {
    return await this.moviesService.deleteMoviesByIds(deleteMoviesDto.ids);
  }
}
