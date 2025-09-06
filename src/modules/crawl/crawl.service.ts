/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from '@/modules/movies/schemas/movie.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Slug, SlugDocument } from './schemas/slug.schema';
import {
  CrawlStatus,
  CrawlStatusDocument,
  MovieType,
} from './schemas/crawl-status.schema';
import pLimit from 'p-limit';
import { movieType } from './constants/crawl.constants';

@Injectable()
export class CrawlService {
  private readonly apiUrl: string | undefined;
  private readonly maxRetries = 3;
  private readonly limit = 64;
  private readonly movieTypes = movieType;

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Slug.name) private slugModel: Model<SlugDocument>,
    @InjectModel(CrawlStatus.name)
    private crawlStatusModel: Model<CrawlStatusDocument>,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('API_CRAWL_MOVIES_URL');
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  movieHasCrawled(movieTypesFromDb: MovieType[]) {
    const arrHasCrawled: MovieType[] = [];
    const arrNotCrawled: MovieType[] = [];

    this.movieTypes.forEach((type) => {
      if (movieTypesFromDb.includes(type)) {
        arrHasCrawled.push(type);
      } else {
        arrNotCrawled.push(type);
      }
    });

    return { arrHasCrawled, arrNotCrawled };
  }

  async fetchWithRetry(
    url: string,
    retries = this.maxRetries,
    options?: RequestInit & { slug?: string },
  ) {
    for (let i = 0; i < retries; i++) {
      try {
        const timeSleep = Math.pow(2, i) * 1000;
        const response = await fetch(url, options);

        if (!response.ok) {
          console.log(
            `❌ Fetch ${options?.slug} thất bại với status ${response.status}. Thử lại lần ${i + 1}/${this.maxRetries}`,
          );
          console.log(`⏳Nghỉ ${timeSleep / 1000}s trước khi thử lại...`);
          await this.sleep(timeSleep);
          continue;
        }

        const data = await response.json();

        return data;
      } catch (error) {
        console.log(`❌Fetch thất bại Thử lại lần ${i + 1}/${this.maxRetries}`);
        await this.sleep(1000);
        continue;
      }
    }
  }

  async initializeCrawlStatus() {
    try {
      const existingStatus = await this.crawlStatusModel.findOne().lean();

      if (existingStatus) {
        console.log(
          '⚠️ Trạng thái thu thập đã tồn tại, không cần khởi tạo lại.',
        );
        return {
          status: '⚠️ Trạng thái thu thập đã tồn tại, không cần khởi tạo lại.',
        };
      }

      const result = await this.crawlStatusModel.create({
        movieTypes: [],
        selectedType: MovieType.PHIM_BO,
        currentPage: 1,
        totalMovies: 0,
        totalPages: 0,
      });

      if (result) {
        console.log('✅ Đã khởi tạo trạng thái thu thập phim ban đầu.');
        return {
          status: '✅ Đã khởi tạo trạng thái thu thập phim ban đầu.',
        };
      } else {
        throw new InternalServerErrorException(
          '❌ Lỗi khi khởi tạo trạng thái thu thập phim.',
        );
      }
    } catch (error) {
      console.log('>>> Lỗi khi khởi tạo trạng thái thu thập:', error);
      throw new InternalServerErrorException(
        '❌ Lỗi khi khởi tạo trạng thái thu thập phim.',
      );
    }
  }

  async updateMovieTypesInCrawlStatus(newType: MovieType) {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne();

      if (!crawlStatus) {
        console.log('❌ Trạng thái thu thập không tồn tại.');
        return false;
      }

      const index = this.movieTypes.indexOf(newType);

      if (index !== -1 && !crawlStatus.movieTypes.includes(newType)) {
        const result = await this.crawlStatusModel.updateOne(
          { _id: crawlStatus._id },
          {
            movieTypes: [...crawlStatus.movieTypes, newType],
            selectedType: this.movieTypes[index + 1] || this.movieTypes[0],
            currentPage: 1,
            totalPages: 0,
            totalMovies: 0,
          },
        );

        return result.modifiedCount > 0;
      } else {
        console.log(
          '⚠️ Loại phim đã được thu thập hoặc không hợp lệ:',
          newType,
        );
        return false;
      }
    } catch (error) {
      console.log('>>> Lỗi khi cập nhật loại phim đã thu thập:', error);
      return false;
    }
  }

  async fetchMovieDetail(slug: string) {
    const url = `${this.apiUrl}/phim/${slug}`;
    const data = await this.fetchWithRetry(url, 3, { slug });
    return data ?? null;
  }

  async fetchDataMovie(type: MovieType, limit = 64, page = 1) {
    const url = `${this.apiUrl}/v1/api/danh-sach/${type}?limit=${limit}&page=${page}`;
    const data = await this.fetchWithRetry(url, 3, { slug: type });
    return data?.data ?? null;
  }

  async fetchCrawlStatus() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus;
    } catch (error) {
      console.log('>>> Lỗi khi lấy trạng thái thu thập:', error);
      return null;
    }
  }

  async fetchSlugs(limit = 100, page = 1, type: MovieType = MovieType.PHIM_BO) {
    try {
      const res = await this.slugModel
        .find({ type })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      return res.map((item) => item.slug);
    } catch (error) {
      console.log('>>> Lỗi khi lấy slug:', error);
      return [];
    }
  }

  async handleResetCrawlStatus() {
    try {
      const result = await this.crawlStatusModel.updateMany(
        {},
        {
          movieTypes: [],
          selectedType: MovieType.PHIM_BO,
          isCrawling: false,
          shouldStop: false,
          currentPage: 1,
          totalMovies: 0,
          totalPages: 0,
        },
      );

      return {
        status:
          result.modifiedCount > 0
            ? '✅ Đã reset trạng thái thu thập về ban đầu.'
            : '⚠️ Trạng thái thu thập đã ở trạng thái ban đầu.',
      };
    } catch (error) {
      console.log('>>> Lỗi khi reset trạng thái thu thập:', error);
      return { status: '❌ Lỗi khi reset trạng thái thu thập.' };
    }
  }

  async saveMovieToDb(data: any) {
    try {
      const movieId = data?.movie?._id;
      delete data?.movie?._id;

      const result = await this.movieModel.updateOne(
        { movie_id: movieId },
        {
          $setOnInsert: {
            movie_id: movieId,
            actors: data?.movie?.actor,
            directors: data?.movie?.director,
            categories: data?.movie?.category,
            is_cinema: data?.movie?.chieurap,
            countries: data?.movie?.country,
            episodes: data?.episodes || [],
            ...data.movie,
          },
        },
        { upsert: true },
      );

      return result?.upsertedCount > 0;
    } catch (error) {
      console.log('>>> Lỗi khi lưu phim vào cơ sở dữ liệu:', error);
      return null;
    }
  }

  async checkIsCrawling() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus?.isCrawling || false;
    } catch (error) {
      console.log('>>> Lỗi khi kiểm tra trạng thái crawling:', error);
      return false;
    }
  }

  async setIsCrawling(value: boolean) {
    try {
      const result = await this.crawlStatusModel.updateMany(
        {},
        {
          $set: { isCrawling: value },
        },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.log('>>> Lỗi khi cập nhật trạng thái crawling:', error);
      return false;
    }
  }

  showInfoCrawl(
    currentType: MovieType,
    nextType: MovieType,
    totalPages: number,
  ) {
    console.log('========= TRẠNG THÁI CÀO PHIM =========');
    console.log('Loại phim hiện tại:', currentType);
    console.log('Loại phim tiếp theo:', nextType);
    console.log('Tổng số trang:', totalPages);
    console.log('----------------------------------------\n');
  }

  logCrawlStats(pageNumber: number, slugs: string[], results: any[]) {
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'success',
    ).length;
    const alreadyExistCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'already_exist',
    ).length;
    const notFoundCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'not_found',
    ).length;
    const errorCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'error',
    ).length;

    console.log(`\n📌 Trang ${pageNumber} đã hoàn thành`);
    console.table([
      { Loại: 'Tổng slug', 'Số lượng': slugs.length },
      { Loại: '✅ Thành công', 'Số lượng': successCount },
      { Loại: '⚠️ Đã tồn tại', 'Số lượng': alreadyExistCount },
      { Loại: '❌ Không tìm thấy', 'Số lượng': notFoundCount },
      { Loại: '🔥 Lỗi', 'Số lượng': errorCount },
    ]);
  }

  async handleStartCrawlSlugs() {
    try {
      const crawStatus = await this.fetchCrawlStatus();
      const { arrHasCrawled, arrNotCrawled } = this.movieHasCrawled(
        crawStatus?.movieTypes || [],
      );

      if (arrHasCrawled?.length === this.movieTypes?.length) {
        return { status: 'Tất cả các loại phim đã được thu thập.' };
      }

      // Đánh dấu đang trong trạng thái crawling
      await this.setIsCrawling(true);

      console.log('🚀 Bắt đầu quá trình thu thập slug phim...\n');

      for (let i = 0; i < arrNotCrawled.length; i++) {
        const crawStatus = await this.fetchCrawlStatus();
        const type = arrNotCrawled[i];

        // Lấy thông tin phân trang
        const movieData = await this.fetchDataMovie(
          type || MovieType.PHIM_BO,
          this.limit,
          crawStatus?.currentPage || 1,
        );

        if (!movieData) {
          console.log(
            `❌ Không lấy được dữ liệu phim cho loại: ${type}, bỏ qua...`,
          );
          continue;
        }

        const totalPages: number =
          movieData?.params?.pagination?.totalPages || 0;

        this.showInfoCrawl(
          type,
          arrNotCrawled[i + 1] || arrNotCrawled[0],
          totalPages,
        );

        for (let j = crawStatus?.currentPage || 1; j <= totalPages; j++) {
          const movieData = await this.fetchDataMovie(
            type || MovieType.PHIM_BO,
            this.limit,
            j,
          );

          if (!movieData) {
            console.log(
              `❌ Không lấy được dữ liệu phim cho loại: ${type} ở trang ${j}, bỏ qua...`,
            );
            continue;
          }

          const slugs: string[] =
            movieData?.items?.map((item: any) => item.slug) || [];

          console.log(`===== Đang thu thập trang ${j} / ${totalPages} =====`);

          const tasks = slugs?.map((slug) => {
            return {
              updateOne: {
                filter: { slug }, // tìm theo slug
                update: { $setOnInsert: { slug, type } }, // nếu chưa có thì insert
                upsert: true, // bật upsert
              },
            };
          });

          if (!tasks || tasks.length === 0) {
            console.log(`⚠️ Trang ${j} không có slug nào để lưu.`);
            continue;
          }

          console.log(
            `📌 Trang ${j} có ${tasks?.length || 0} slug cần lưu vào database.`,
          );
          const result = await this.slugModel.bulkWrite(tasks || []);
          // result.upsertedIds chứa các id của document mới được thêm
          const newCount = Object.keys(result.upsertedIds || {}).length;
          const existingCount = (tasks?.length || 0) - newCount;

          console.log(`✅ Có ${newCount} slug mới được thêm vào DB.`);
          console.log(`ℹ️ Có ${existingCount} slug đã tồn tại trong DB.`);

          // Cập nhật trạng thái crawl
          await this.crawlStatusModel.updateOne(
            { _id: crawStatus?._id },
            {
              $set: {
                currentPage: j + 1,
                totalPages,
                totalMovies: movieData?.params?.pagination?.totalItems || 0,
              },
            },
          );

          console.log('⏳ Đang chờ 50ms giây trước khi qua trang tiếp theo...');
          await this.sleep(50);
          console.log('----------------------------------------\n');
        }

        // Cập nhật loại phim đã thu thập xong
        const updated = await this.updateMovieTypesInCrawlStatus(type);

        if (updated) {
          console.log(
            `🎉 Đã thu thập xong tất cả slug cho loại phim: ${type}\n`,
          );
          console.log('Delay 3s trước khi chuyển sang loại phim tiếp theo...');
          await this.sleep(3000);
        } else {
          console.log(
            `❌ Thu thập slug cho loại phim ${type} nhưng không thể cập nhật trạng thái.\n`,
          );
          continue;
        }
      }

      await this.setIsCrawling(false);

      console.log('🎉 Đã thu thập xong tất cả slug trong danh sách.');

      return {
        status: 'Đã thu thập xong tất cả slug trong danh sách.',
      };
    } catch (error) {
      console.error('❌ Lỗi khi crawl slug:', error);
      await this.setIsCrawling(false);
      return { status: 'Thu nhập slug thất bại!' };
    }
  }

  async findSlugNotInMovies() {
    try {
      return await this.slugModel.aggregate([
        {
          $lookup: {
            from: 'movies', // bảng (collection) để join (ở đây là 'movies')
            localField: 'slug', // field trong collection hiện tại (slugModel) dùng để so khớp
            foreignField: 'slug', // field bên collection 'movies' dùng để so khớp
            as: 'movieInfo', // kết quả join sẽ đưa vào một mảng mới có tên là 'movieInfo'
          },
        },
        {
          $match: {
            movieInfo: { $size: 0 }, // chỉ lấy các document mà movieInfo rỗng (tức là slug không tồn tại trong 'movies')
          },
        },
        {
          $project: { slug: 1, _id: 0 }, // chỉ hiển thị trường 'slug', ẩn _id đi
        },
      ]);
    } catch (error) {
      console.log('>>> Lỗi khi tìm slug chưa có trong movies:', error);
      return [];
    }
  }

  async crawlMoviesInPage(
    j: number,
    totalPages: number,
    slugs: string[],
    limit: any,
  ) {
    console.log(`📄 Đang thu thập phim tại trang ${j} / ${totalPages}`);

    if (!slugs || slugs.length === 0) {
      console.log(
        `⚠️ Trang ${j} không có slug nào để thu thập. Bỏ qua sau 300ms...\n`,
      );
      await this.sleep(300);
      return;
    }

    const tasks = slugs.map((slug, i) =>
      limit(async () => {
        try {
          const movieDetail = await this.fetchMovieDetail(slug);

          if (!movieDetail?.status) {
            console.log(`❌ Không tìm thấy phim với slug: ${slug}`);
            return { slug, status: 'not_found' };
          }

          const isNew = await this.saveMovieToDb(movieDetail);
          const progress = `${i + 1}/${slugs.length}`;

          if (isNew) {
            console.log(
              `✅ [${progress}] Phim: ${movieDetail.movie.name} đã được lưu vào hệ thống`,
            );
          } else {
            console.log(
              `⚠️ [${progress}] Phim ${movieDetail.movie.name} đã tồn tại trong hệ thống`,
            );
          }

          return { slug, status: isNew ? 'success' : 'already_exist' };
        } catch (err) {
          console.error(`  🔥 Lỗi xử lý slug ${slug}:`, err.message);
          return { slug, status: 'error', error: err };
        }
      }),
    );

    const results = await Promise.allSettled(tasks);
    this.logCrawlStats(j, slugs, results);

    if (j < totalPages) {
      console.log('⏳ Delay 3s trước khi qua trang tiếp theo...');
      await this.sleep(3000);
    }
  }

  async handleCrawlMovies() {
    try {
      const slugsNotInMovies = await this.findSlugNotInMovies();
      const limit = pLimit(10);
      const totalPages = Math.ceil(slugsNotInMovies.length / 100);

      if (slugsNotInMovies?.length === 0) {
        console.log('🎉 Không còn phim để crawl');
        return {
          status: '🎉 Không còn phim để crawl',
        };
      }

      console.log(`
========= CRAWL STATUS =========
📌 Tổng số phim cần thu thập: ${slugsNotInMovies.length}
📄 Tổng số trang cần thu thập: ${totalPages}
================================
`);

      for (let j = 1; j <= totalPages; j++) {
        const slugs: string[] = slugsNotInMovies
          .slice((j - 1) * 100, j * 100) // j = 1 -> 0-99, j=2 -> 100-199
          .map((item) => item.slug);

        await this.crawlMoviesInPage(j, totalPages, slugs, limit);
      }

      return {
        status: '🎉 Đã hoàn tất quá trình crawl phim.',
      };
    } catch (error) {
      console.log('>>> Lỗi khi crawl các phim:', error);
      return {
        status: '❌ Lỗi khi crawl các phim.',
      };
    }
  }
}
