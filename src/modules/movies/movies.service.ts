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
import { UpdateMovieDto } from './dto/update-movie.dto';

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
      const select = '-__v -createdAt -updatedAt -episodes';
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

  async updateInfoMovieById(id: string, dataUpdate: UpdateMovieDto) {
    try {
      const movie = await this.movieModel.findByIdAndUpdate(
        id,
        { $set: dataUpdate },
        { new: true }, // trả về document sau khi đã cập nhật}
      );

      if (!movie) {
        throw new NotFoundException(NOT_FOUND_ERROR);
      }

      return {
        status: true,
        message: 'Cập nhật thành công',
        data: {
          id: movie._id,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async deleteMoviesByIds(ids: string[]) {
    try {
      const result = await this.movieModel.deleteMany({ _id: { $in: ids } });

      return {
        status: true,
        message: 'Xoá thành công',
        data: {
          ids: ids,
          deletedCount: result.deletedCount,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async getMoviesStats() {
    try {
      const [
        totalMovies,
        totalSeries,
        totalSingles,
        totalCinemas,
        totalTVShows,
        totalAnimations,
      ] = await Promise.allSettled([
        this.movieModel.countDocuments(),
        this.movieModel.countDocuments({ type: 'series' }),
        this.movieModel.countDocuments({ type: 'single' }),
        this.movieModel.countDocuments({ is_cinema: true }),
        this.movieModel.countDocuments({ type: 'tvshows' }),
        this.movieModel.countDocuments({ type: 'hoathinh' }),
      ]);

      return {
        status: true,
        message: 'Thành công',
        data: {
          totalMovies:
            totalMovies.status === 'fulfilled' ? totalMovies.value : 0,
          totalSeries:
            totalSeries.status === 'fulfilled' ? totalSeries.value : 0,
          totalSingles:
            totalSingles.status === 'fulfilled' ? totalSingles.value : 0,
          totalCinemas:
            totalCinemas.status === 'fulfilled' ? totalCinemas.value : 0,
          totalTVShows:
            totalTVShows.status === 'fulfilled' ? totalTVShows.value : 0,
          totalAnimations:
            totalAnimations.status === 'fulfilled' ? totalAnimations.value : 0,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }
}
