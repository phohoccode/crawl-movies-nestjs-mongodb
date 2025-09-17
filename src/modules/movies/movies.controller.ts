import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateMovieDto } from './dto/create-movie.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/auth/passport/public.decorator';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get('stats')
  async getMoviesStats() {
    return await this.moviesService.getMoviesStats();
  }

  @Public()
  @Throttle({ short: {} })
  @Get('search')
  async searchMovies(@Query() searchMovieDto: SearchMoviesDto) {
    return this.moviesService.searchMovies(searchMovieDto);
  }

  @Public()
  @Throttle({ long: {} })
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

  @Public()
  @Throttle({ short: {} })
  @Get('info/:slug')
  async getMovieBySlug(@Param() getMovieBySlugDto: GetMovieBySlugDto) {
    return this.moviesService.getMovieBySlug(getMovieBySlugDto.slug);
  }

  @Public()
  @Throttle({ short: {} })
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

  @Throttle({ medium: {} })
  @Patch(':id')
  async updateInfoMovie(
    @Param() params: ParamsUpdateMovie,
    @Body() dataUpdate: UpdateMovieDto,
  ) {
    return await this.moviesService.updateInfoMovieById(params.id, dataUpdate);
  }

  @Throttle({ medium: {} })
  @Delete()
  async deleteMovies(@Body() deleteMoviesDto: DeleteMoviesDto) {
    return await this.moviesService.deleteMoviesByIds(deleteMoviesDto.ids);
  }

  @Throttle({ medium: {} })
  @Post('new-movie')
  async createMovie(@Body() createMovieDto: CreateMovieDto) {
    return await this.moviesService.createMovie(createMovieDto);
  }
}
