/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MovieType } from './types/movie.type';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { FilterQuery, Model } from 'mongoose';
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND_ERROR,
} from './constants/error.contant';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
  ) {}

  async getMoviesFromDb(
    condition: FilterQuery<MovieDocument>,
    limit: number,
    page: number,
  ): Promise<{ movies: MovieDocument[]; totals: number }> {
    try {
      const select = '-_id -__v -createdAt -updatedAt -episodes';
      const skip = (page - 1) * limit;

      const movies = await this.movieModel
        .find(condition)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select(select)
        .lean();

      const totals = await this.movieModel.countDocuments(condition);

      return {
        movies,
        totals,
      };
    } catch (error) {
      console.log(error);
      return {
        movies: [],
        totals: 0,
      };
    }
  }

  async getMovies(type: MovieType, limit: number, page: number) {
    try {
      const typeMapping: Record<MovieType, any> = {
        'phim-le': { type: 'single' },
        'phim-bo': { type: 'series' },
        'phim-chieu-rap': { is_cinema: true },
        'hoat-hinh': { type: 'hoathinh' },
        'tv-shows': { type: 'tvshow' },
        'phim-vietsub': { lang: { $regex: 'Vietsub', $options: 'i' } },
        'phim-thuyet-minh': { lang: { $regex: 'Thuyết minh', $options: 'i' } },
        'phim-long-tieng': { lang: { $regex: 'Lồng tiếng', $options: 'i' } },
      };

      const conditionFilter = typeMapping[type];

      const data = await this.getMoviesFromDb(conditionFilter, limit, page);

      const { movies, totals } = data;

      return {
        status: true,
        message: 'Thành công',
        data: {
          pagination: {
            total_page: Math.ceil(totals / limit),
            total_items: totals,
            current_page: page,
            limit: limit,
          },
          movies,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async getMovieBySlug(slug: string) {
    try {
      const select = '-_id -__v -createdAt -updatedAt';

      const movie = await this.movieModel
        .findOne({ slug })
        .select(select)
        .lean();

      if (!movie) {
        throw new NotFoundException(NOT_FOUND_ERROR);
      }

      return {
        status: true,
        message: 'Thành công',
        data: movie,
      };
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async searchMovies(keyword: string, limit: number, page: number) {
    try {
      const conditionFilter = {
        name: { $regex: keyword, $options: 'i' },
        origin_name: { $regex: keyword, $options: 'i' },
      };

      const data = await this.getMoviesFromDb(conditionFilter, limit, page);

      const { movies, totals } = data;

      return {
        status: true,
        message: 'Thành công',
        data: {
          pagination: {
            total_page: Math.ceil(totals / limit),
            total_items: totals,
            current_page: page,
            limit: limit,
          },
          movies,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async getMoviesByGenreOrCountry(
    type: 'genre' | 'country',
    slug: string,
    limit: number,
    page: number,
  ) {
    try {
      const conditionFilter = {
        [type === 'genre' ? 'categories' : 'countries']: {
          $elemMatch: { slug },
        },
      };

      const data = await this.getMoviesFromDb(conditionFilter, limit, page);

      const { movies, totals } = data;

      return {
        status: true,
        message: 'Thành công',
        data: {
          pagination: {
            total_page: Math.ceil(totals / limit),
            total_items: totals,
            current_page: page,
            limit: limit,
          },
          movies,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async getMoviesByYear(year: string, limit: number, page: number) {
    try {
      const conditionFilter = { year };

      const data = await this.getMoviesFromDb(conditionFilter, limit, page);

      const { movies, totals } = data;

      return {
        status: true,
        message: 'Thành công',
        data: {
          pagination: {
            total_page: Math.ceil(totals / limit),
            total_items: totals,
            current_page: page,
            limit: limit,
          },
          movies,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }
}
