/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MovieType } from './types/movie.type';
import { GetMoviesDto } from './dto/get-movies.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { Model } from 'mongoose';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
  ) {}

  async getMovies(query: GetMoviesDto) {
    try {
      const { type, limit = 10, page = 1 } = query;

      const skip = (page - 1) * limit;

      const select = '-_id -__v -createdAt -updatedAt -episodes';

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

      if (!type || !(type in typeMapping)) {
        throw new InternalServerErrorException({
          message: 'Loại phim không hợp lệ',
        });
      }

      const conditionFilter = typeMapping[type as MovieType];

      const movies = await this.movieModel
        .find(conditionFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select(select)
        .lean();

      const totals = await this.movieModel.countDocuments(conditionFilter);

      return {
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
      throw new InternalServerErrorException({
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
      });
    }
  }
}
