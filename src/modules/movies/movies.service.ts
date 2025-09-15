/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Category, Country, Language, MovieType } from './types/movie.type';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { FilterQuery, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND_ERROR,
} from './constants/error.contant';
import { UpdateMovieDto } from './dto/update-movie.dto';
import {
  CategoriesArray,
  CountriesArray,
  titlePageMapping,
} from './constants/movie.contant';
import { Slug, SlugDocument } from '../crawl/schemas/slug.schema';
import {
  CrawlStatus,
  CrawlStatusDocument,
} from '../crawl/schemas/crawl-status.schema';
import {
  filterNonEmptyStrings,
  generateImageFromMovies,
  generateMetaDataFn,
  getValueByPromiseAllSettled,
  mapCountriesOrCategories,
  mapEpisodesToEpisodeDataDto,
} from '@/helpers/utils';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Slug.name) private slugModel: Model<SlugDocument>,
    @InjectModel(CrawlStatus.name)
    private crawlStatusModel: Model<CrawlStatusDocument>,
  ) {}

  async getMoviesFromDb(
    condition: FilterQuery<MovieDocument>,
    limit: number,
    page: number,
    sort?: Record<string, 1 | -1>,
  ): Promise<{ movies: MovieDocument[]; totals: number }> {
    try {
      const select = '-__v -createdAt -updatedAt -episodes';
      const skip = (page - 1) * limit;

      const movies = await this.movieModel
        .find(condition)
        .skip(skip)
        .limit(limit)
        .sort(sort || { 'modified.time': -1 })
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
      const typeMapping: Partial<Record<MovieType, any>> = {
        'phim-le': { type: 'single' },
        'phim-bo': { type: 'series' },
        'phim-chieu-rap': { is_cinema: true },
        'hoat-hinh': { type: 'hoathinh' },
        'tv-shows': { type: 'tvshows' },
        subteam: { sub_docquyen: true },
        'phim-vietsub': { lang: { $regex: 'Vietsub', $options: 'i' } },
        'phim-thuyet-minh': { lang: { $regex: 'Thuyết minh', $options: 'i' } },
        'phim-long-tieng': { lang: { $regex: 'Lồng tiếng', $options: 'i' } },
        latest: {},
      };

      let conditionFilter = {};

      if (CountriesArray.includes(type as Country)) {
        conditionFilter = { countries: { $elemMatch: { slug: type } } };
      } else if (CategoriesArray.includes(type as Category)) {
        conditionFilter = { categories: { $elemMatch: { slug: type } } };
      } else {
        conditionFilter = typeMapping[type] || {};
      }

      if (Object.keys(conditionFilter)?.length === 0 && type !== 'latest') {
        return {
          status: false,
          message: 'Không tìm thấy phim phù hợp!',
          data: { items: [], params: {} },
        };
      }

      const data = await this.getMoviesFromDb(conditionFilter, limit, page);
      const { movies, totals } = data;

      const { titleHead, descriptionHead } = generateMetaDataFn(type);
      const images = generateImageFromMovies(movies);

      return {
        status: true,
        message: 'Thành công',
        data: {
          seoOnPage: {
            titleHead,
            descriptionHead,
            or_imgages: images,
          },
          params: {
            pagination: {
              totalPages: Math.ceil(totals / limit),
              totalItems: totals,
              currentPage: page,
              totalItemsPerPage: limit,
            },
          },
          titlePage: titlePageMapping[type] || 'Danh sách phim',
          items: movies,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async getMovieBySlug(slug: string) {
    try {
      const select = '-__v -createdAt -updatedAt';

      const movie = await this.movieModel
        .findOne({ slug })
        .select(select)
        .lean();

      if (!movie) {
        throw new NotFoundException(NOT_FOUND_ERROR);
      }

      const { episodes, ...finalMovie } = movie;

      return {
        status: true,
        message: 'Thành công',
        movie: finalMovie,
        episodes,
      };
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async searchMovies(query: SearchMoviesDto) {
    try {
      const {
        keyword,
        limit,
        page,
        sort_lang: language,
        category,
        country,
        year,
        sort_type: sortType,
      } = query;

      const languageMapping: Record<Language, string> = {
        'long-tieng': 'Lồng tiếng',
        'thuyet-minh': 'Thuyết minh',
        vietsub: 'Vietsub',
      };

      const conditionFilter = {
        ...(keyword
          ? {
              $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { origin_name: { $regex: keyword, $options: 'i' } },
              ],
            }
          : {}),
        ...(language
          ? { lang: { $regex: languageMapping[language], $options: 'i' } }
          : {}),
        ...(category ? { categories: { $elemMatch: { slug: category } } } : {}),
        ...(country ? { countries: { $elemMatch: { slug: country } } } : {}),
        ...(year ? { year } : {}),
      };

      // Mặc định sắp xếp theo thời gian cập nhật mới nhất
      let sort: Record<string, 1 | -1> = { 'modified.time': -1 };

      if (sortType === 'asc') {
        sort = { year: 1 };
      } else if (sortType === 'desc') {
        sort = { year: -1 };
      }

      const data = await this.getMoviesFromDb(
        conditionFilter,
        limit,
        page,
        sort,
      );

      const { movies, totals } = data;
      const images = generateImageFromMovies(movies);

      return {
        status: true,
        message: 'Thành công',
        data: {
          seoOnPage: {
            titleHead: `Tìm kiếm phim với từ khoá ${keyword} | Trang ${page}`,
            descriptionHead: `Phim với từ khoá ${keyword}. Tìm kiếm và xem phim chất lượng cao, miễn phí, cập nhật nhanh nhất tại PHOFLIX-V3.`,
            or_images: images,
          },
          titlePage: `Kết quả tìm kiếm với từ khoá: ${keyword}`,
          params: {
            pagination: {
              totalPages: Math.ceil(totals / limit),
              totalItems: totals,
              currentPage: page,
              totalItemsPerPage: limit,
            },
          },
          items: movies,
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

  async createMovie(createMovieDto: CreateMovieDto) {
    try {
      const movieExist = await this.movieModel.find({
        $or: [{ slug: createMovieDto.slug }],
      });

      if (movieExist.length > 0) {
        throw new ConflictException('Phim đã tồn tại trong hệ thống');
      }

      const {
        categories,
        countries,
        episodes,
        actors,
        directors,
        ...remainingData
      } = createMovieDto;

      // fomat lại categories và countries theo schema
      const finalCategories = mapCountriesOrCategories(categories, 'category');
      const finalCountries = mapCountriesOrCategories(countries, 'country');

      // fomat lại actors theo schema
      const finalActors = filterNonEmptyStrings(actors);

      // fomat lại directors theo schema
      const finalDirectors = filterNonEmptyStrings(directors);

      // fomat lại episodes theo schema
      const finalEpisodes = mapEpisodesToEpisodeDataDto(
        episodes || [],
        createMovieDto.name,
      );

      // tổng hợp data cuối cùng để tạo mới
      const finalData = {
        movie_id: uuidv4(),
        categories: finalCategories,
        countries: finalCountries,
        episodes: finalEpisodes || [],
        actors: finalActors || [],
        directors: finalDirectors || [],
        ...remainingData,
      };

      const newMovie = await this.movieModel.create(finalData);

      return {
        status: true,
        message: 'Thành công!',
        data: {
          movie: newMovie,
        },
      };
    } catch (error) {
      console.log(error);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async updateInfoMovieById(id: string, dataUpdate: UpdateMovieDto) {
    try {
      const movieExist = await this.movieModel.findById(id);

      if (!movieExist) {
        throw new NotFoundException(NOT_FOUND_ERROR);
      }

      const {
        categories,
        countries,
        episodes,
        actors,
        directors,
        ...remainingData
      } = dataUpdate;

      // nếu có categories truyền vào thì fomat lại còn không thì giữ nguyên
      const finalCategories =
        categories && categories.length > 0
          ? mapCountriesOrCategories(categories, 'category')
          : movieExist.categories;

      // nếu có countries truyền vào thì fomat lại còn không thì giữ nguyên
      const finalCountries =
        countries && countries.length > 0
          ? mapCountriesOrCategories(countries, 'country')
          : movieExist.countries;

      // fomat lại actors theo schema
      const finalActors = filterNonEmptyStrings(actors);

      // fomat lại directors theo schema
      const finalDirectors = filterNonEmptyStrings(directors);

      // nếu có episodes truyền vào thì fomat lại còn không thì giữ nguyên
      const finalEpisodes =
        episodes && episodes.length > 0
          ? mapEpisodesToEpisodeDataDto(
              episodes,
              dataUpdate.name || movieExist.name, // nếu có đổi tên phim thì lấy tên mới để map
            )
          : movieExist.episodes;

      // tổng hợp data cuối cùng để update
      const finalData = {
        categories: finalCategories,
        countries: finalCountries,
        episodes: finalEpisodes,
        actors: finalActors,
        directors: finalDirectors,
        ...remainingData,
      };

      const movie = await this.movieModel.findByIdAndUpdate(
        id,
        {
          $set: {
            'modified.time': new Date().toISOString(), // cập nhật lại thời gian chỉnh sửa
            ...finalData,
          },
        },
        { new: true }, // trả về document sau khi update
      );

      if (!movie) {
        throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
      }

      return {
        status: true,
        message: 'Thành công!',
        data: {
          movie,
        },
      };
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async deleteMoviesByIds(ids: string[]) {
    try {
      const result = await this.movieModel.deleteMany({ _id: { $in: ids } });

      return {
        status: true,
        message: 'Thành công',
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
        totalUpdatedMovies,
        totalSlugs,
        totalSeries,
        totalSingles,
        totalCinemas,
        totalTVShows,
        totalAnimations,
        totalDubbedMovies, // phim thuyết minh
        totalSubtitledMovies, // phim vietsub
        totalVoiceDubbedMovies, // phim lồng tiếng
      ] = await Promise.allSettled([
        this.movieModel.countDocuments(),
        this.crawlStatusModel
          .findOne()
          .then((doc) => (doc ? doc.totalUpdatedMovies : 0)),
        this.slugModel.countDocuments(),
        this.movieModel.countDocuments({ type: 'series' }),
        this.movieModel.countDocuments({ type: 'single' }),
        this.movieModel.countDocuments({ is_cinema: true }),
        this.movieModel.countDocuments({ type: 'tvshows' }),
        this.movieModel.countDocuments({ type: 'hoathinh' }),
        this.movieModel.countDocuments({
          lang: { $regex: 'Thuyết minh', $options: 'i' },
        }),
        this.movieModel.countDocuments({
          lang: { $regex: 'Vietsub', $options: 'i' },
        }),
        this.movieModel.countDocuments({
          lang: { $regex: 'Lồng tiếng', $options: 'i' },
        }),
      ]);

      return {
        status: true,
        message: 'Thành công',
        data: {
          totalMovies: getValueByPromiseAllSettled(totalMovies) || 0,
          totalUpdatedMovies:
            getValueByPromiseAllSettled(totalUpdatedMovies) || 0,
          totalSlugs: getValueByPromiseAllSettled(totalSlugs) || 0,
          totalSeries: getValueByPromiseAllSettled(totalSeries) || 0,
          totalSingles: getValueByPromiseAllSettled(totalSingles) || 0,
          totalCinemas: getValueByPromiseAllSettled(totalCinemas) || 0,
          totalTVShows: getValueByPromiseAllSettled(totalTVShows) || 0,
          totalAnimations: getValueByPromiseAllSettled(totalAnimations) || 0,
          totalDubbedMovies:
            getValueByPromiseAllSettled(totalDubbedMovies) || 0,
          totalSubtitledMovies:
            getValueByPromiseAllSettled(totalSubtitledMovies) || 0,
          totalVoiceDubbedMovies:
            getValueByPromiseAllSettled(totalVoiceDubbedMovies) || 0,
        },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }
}
