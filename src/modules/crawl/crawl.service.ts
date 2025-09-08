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
} from './schemas/crawl-status.schema';
import pLimit from 'p-limit';
import { MOVIE_TYPE, MovieType } from './constants/crawl.constants';
import { getPages, logCrawlStats, showInfoCrawl } from '@/helpers/util';
import { CrawlGateway } from './gateway/crawl.gateway';
import { MoviesService } from '../movies/movies.service';

@Injectable()
export class CrawlService {
  private readonly apiUrl: string | undefined;
  private readonly maxRetries = 3;
  private readonly limit = 64;

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(Slug.name) private slugModel: Model<SlugDocument>,
    @InjectModel(CrawlStatus.name)
    private crawlStatusModel: Model<CrawlStatusDocument>,

    // Inject ConfigService to get environment variables
    private readonly configService: ConfigService,
    private readonly crawlGateway: CrawlGateway,
    private readonly moviesService: MoviesService,
  ) {
    this.apiUrl = this.configService.get<string>('API_CRAWL_MOVIES_URL');
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  movieHasCrawled(movieTypesFromDb: MovieType[]) {
    const arrHasCrawled: MovieType[] = [];
    const arrNotCrawled: MovieType[] = [];

    MOVIE_TYPE.forEach((type) => {
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
          this.logProgress(
            `❌ Fetch ${options?.slug} thất bại với status ${response.status}. Thử lại lần ${i + 1}/${this.maxRetries}`,
          );
          this.logProgress(`⏳Nghỉ ${timeSleep / 1000}s trước khi thử lại...`);
          await this.sleep(timeSleep);
          continue;
        }

        const data = await response.json();

        return data;
      } catch (error) {
        this.logProgress(
          `❌Fetch thất bại Thử lại lần ${i + 1}/${this.maxRetries}`,
        );
        await this.sleep(1000);
        continue;
      }
    }
  }

  logProgress(message: string) {
    console.log(message);
    this.crawlGateway.sendProgress(message);
  }

  async updateMovieTypesInCrawlStatus(newType: MovieType) {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne();

      if (!crawlStatus) {
        this.logProgress('❌ Trạng thái thu thập không tồn tại.');
        return false;
      }

      const index = MOVIE_TYPE.indexOf(newType);

      if (index !== -1 && !crawlStatus.movieTypes.includes(newType)) {
        const result = await this.crawlStatusModel.updateOne(
          { _id: crawlStatus._id },
          {
            movieTypes: [...crawlStatus.movieTypes, newType],
            selectedType: MOVIE_TYPE[index + 1] || MOVIE_TYPE[0],
            currentPage: 1,
            totalPages: 0,
            totalMovies: 0,
          },
        );

        return result.modifiedCount > 0;
      } else {
        this.logProgress(
          '⚠️ Loại phim đã được thu thập hoặc không hợp lệ:' + newType,
        );
        return false;
      }
    } catch (error) {
      this.logProgress('>>> Lỗi khi cập nhật loại phim đã thu thập:' + error);
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
    return data || null;
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

  async getAllSlugs() {
    try {
      const result = await this.slugModel.find().lean();

      return result.map((item) => item.slug);
    } catch (error) {
      console.log('>>> Lỗi khi lấy tất cả slug:', error);
      return [];
    }
  }

  async fetchSlugsByType(
    limit = 100,
    page = 1,
    type: MovieType = MovieType.PHIM_BO,
  ) {
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
      const result = await this.crawlStatusModel.updateOne(
        {},
        {
          movieTypes: [],
          selectedType: MovieType.PHIM_BO,
          isCrawling: false,
          currentPage: 1,
          totalMovies: 0,
          totalPages: 0,
        },
        { upsert: true },
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

  async insertOrUpdateMovie(data: any) {
    try {
      const movieId = data?.movie?._id;
      delete data?.movie?._id;

      const result = await this.movieModel.updateOne(
        { movie_id: movieId },
        {
          $set: {
            actors: data?.movie?.actor,
            directors: data?.movie?.director,
            categories: data?.movie?.category,
            is_cinema: data?.movie?.chieurap,
            countries: data?.movie?.country,
            episodes: data?.episodes || [],
            ...data.movie,
          },

          // Chỉ thêm mới nếu chưa có
          $setOnInsert: { movie_id: movieId },
        },
        { upsert: true },
      );

      return result?.upsertedCount > 0 || result?.modifiedCount > 0;
    } catch (error) {
      console.log('>>> Lỗi khi lưu phim vào cơ sở dữ liệu:', error);
      return false;
    }
  }

  async handleCheckIsCrawling() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus?.isCrawling || false;
    } catch (error) {
      console.log('>>> Lỗi khi kiểm tra trạng thái crawling:', error);
      return false;
    }
  }

  // Đặt trạng thái isCrawling
  async setIsCrawling(value: boolean) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { isCrawling: value } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.log('>>> Lỗi khi cập nhật trạng thái crawling:', error);
      return false;
    }
  }

  async setActionCrawl(action: 'create' | 'update' | null) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { action } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.log('>>> Lỗi khi cập nhật hành động crawl:', error);
      return false;
    }
  }

  async checkActionCrawl() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus?.action || null;
    } catch (error) {
      console.log('>>> Lỗi khi kiểm tra hành động crawl:', error);
      return null;
    }
  }

  async findSlugNotInMovies() {
    try {
      const result = await this.slugModel.aggregate([
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

      return result.map((item) => item.slug);
    } catch (error) {
      console.log('>>> Lỗi khi tìm slug chưa có trong movies:', error);
      return [];
    }
  }

  async updateCurrentPageInCrawlStatus(page: number) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { currentPage: page } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.log(
        '>>> Lỗi khi cập nhật trang hiện tại trong trạng thái thu thập:',
        error,
      );
      return false;
    }
  }

  async fetchTotalMovies() {
    try {
      const result = await this.movieModel.countDocuments();
      return result;
    } catch (error) {
      console.log('>>> Lỗi khi lấy tổng số phim:', error);
      return 0;
    }
  }

  async crawlSlugsInPage(j: number, totalPages: number, type: MovieType) {
    try {
      const response = await this.fetchDataMovie(
        type || MovieType.PHIM_BO,
        this.limit,
        j,
      );

      if (!response?.status) {
        this.logProgress(
          `❌ Không lấy được dữ liệu phim cho loại: ${type} ở trang ${j}, bỏ qua...`,
        );

        return;
      }

      const slugs: string[] =
        response?.data?.items?.map((item: any) => item.slug) || [];

      this.logProgress(`===== Đang thu thập trang ${j} / ${totalPages} =====`);

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
        this.logProgress(`⚠️ Trang ${j} không có slug nào để lưu.`);
        return;
      }

      this.logProgress(
        `📌 Trang ${j} có ${tasks?.length || 0} slug cần lưu vào database.`,
      );

      const result = await this.slugModel.bulkWrite(tasks || []);

      // result.upsertedIds chứa các id của document mới được thêm
      const newCount = Object.keys(result.upsertedIds || {}).length;
      const existingCount = (tasks?.length || 0) - newCount;

      this.logProgress(`✅ Có ${newCount} slug mới được thêm vào DB.`);
      this.logProgress(`ℹ️ Có ${existingCount} slug đã tồn tại trong DB.`);

      // Cập nhật trang hiện tại trong crawl status
      await this.updateCurrentPageInCrawlStatus(j);
    } catch (error) {
      this.logProgress('>>> Lỗi khi crawl slug trong trang:' + error);
      return;
    }
  }

  async handleCrawlSlugs() {
    try {
      const crawStatus = await this.fetchCrawlStatus();
      const { arrHasCrawled, arrNotCrawled } = this.movieHasCrawled(
        crawStatus?.movieTypes || [],
      );

      if (arrHasCrawled?.length === MOVIE_TYPE?.length) {
        this.logProgress('✅ Tất cả các loại phim đã được thu thập.');

        return {
          status: true,
          message: 'Tất cả các loại phim đã được thu thập.',
        };
      }

      this.logProgress('🚀 Bắt đầu quá trình thu thập slug phim...\n');

      for (let i = 0; i < arrNotCrawled.length; i++) {
        const isCrawling = await this.handleCheckIsCrawling();

        if (!isCrawling) {
          this.logProgress('⏸️ Quá trình thu thập đã bị tạm dừng.');
          return { status: 'Quá trình thu thập đã bị tạm dừng.' };
        }

        const type = arrNotCrawled[i];
        const crawStatus = await this.fetchCrawlStatus();

        // Lấy thông tin phân trang
        const response = await this.fetchDataMovie(
          type || MovieType.PHIM_BO,
          this.limit,
          crawStatus?.currentPage || 1,
        );

        if (!response?.status) {
          console.log(
            `❌ Không lấy được dữ liệu phim cho loại: ${type}, bỏ qua...`,
          );
          continue;
        }

        const totalPages: number =
          response?.data?.params?.pagination?.totalPages || 0;

        console.log('========= TRẠNG THÁI CÀO PHIM =========');
        console.log('Loại phim hiện tại:', type);
        console.log(
          'Loại phim tiếp theo:',
          arrNotCrawled[i + 1] || arrNotCrawled[0],
        );
        console.log('Tổng số trang:', totalPages);
        console.log('----------------------------------------\n');

        const startPage = crawStatus?.currentPage || 1;
        const limitFn = pLimit(5);
        const pages = getPages(startPage, totalPages);

        const tasks = pages.map((_, index) => {
          const currentPage = startPage + index;

          return limitFn(async () => {
            const isCrawling = await this.handleCheckIsCrawling();

            if (!isCrawling) {
              this.logProgress('⏸️ Quá trình thu thập đã bị tạm dừng.');

              return { status: 'Quá trình thu thập đã bị tạm dừng.' };
            }

            await this.crawlSlugsInPage(currentPage, totalPages, type);

            this.logProgress(`⏳ Delay 300ms trước khi qua trang tiếp theo...`);
            await this.sleep(300);
          });
        });

        if (!tasks || tasks.length === 0) {
          this.logProgress(
            `⚠️ Loại phim ${type} không có trang nào để thu thập.`,
          );
          continue;
        }

        await Promise.allSettled(tasks);

        // Cập nhật loại phim đã thu thập xong
        const updated = await this.updateMovieTypesInCrawlStatus(type);

        if (updated) {
          this.logProgress(
            `🎉 Đã thu thập xong tất cả slug cho loại phim: ${type}\n`,
          );
          this.logProgress(
            '⏳ Delay 3s trước khi chuyển sang loại phim tiếp theo...',
          );

          await this.sleep(3000);
        } else {
          this.logProgress(
            `❌ Thu thập slug cho loại phim ${type} nhưng không thể cập nhật trạng thái.\n`,
          );
          continue;
        }
      }

      await this.setIsCrawling(false);

      this.logProgress('🎉 Đã thu thập xong tất cả slug trong danh sách.');

      return {
        status: true,
        message: 'Đã thu thập xong tất cả slug trong danh sách.',
      };
    } catch (error) {
      this.logProgress('❌ Lỗi khi crawl slug:' + error);
      return { status: 'Thu nhập slug thất bại!' };
    }
  }

  async crawlMoviesInPage(
    j: number,
    totalPages: number,
    slugs: string[],
    limit: any,
  ) {
    this.logProgress(`📄 Đang thu thập phim tại trang ${j} / ${totalPages}`);

    if (!slugs || slugs.length === 0) {
      this.logProgress(
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
            this.logProgress(`❌ Không tìm thấy phim với slug: ${slug}`);
            return { slug, status: 'not_found' };
          }

          const isNew = await this.insertOrUpdateMovie(movieDetail);
          const progress = `${i + 1}/${slugs.length}`;

          if (isNew) {
            this.logProgress(
              `✅ [${progress}] Phim: ${movieDetail.movie.name} đã được lưu vào hệ thống`,
            );
          } else {
            this.logProgress(
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

    // Hiển thị thống kê kết quả
    logCrawlStats(j, slugs, results);

    if (j < totalPages) {
      const response = await this.moviesService.getMoviesStats();

      const movieStats = response?.data || {};

      this.crawlGateway.refreshTotalMovies({
        totalMovies: movieStats.totalMovies || 0,
        totalSeries: movieStats.totalSeries || 0,
        totalSingles: movieStats.totalSingles || 0,
        totalCinemas: movieStats.totalCinemas || 0,
        totalTVShows: movieStats.totalTVShows || 0,
        totalAnimations: movieStats.totalAnimations || 0,
      });

      this.logProgress('⏳ Delay 3s trước khi qua trang tiếp theo...');
      await this.sleep(3000);
    }
  }

  async handleCrawlMovies(limit: number, type: 'create' | 'update' = 'create') {
    try {
      // Đánh dấu đang trong trạng thái crawling
      await this.setIsCrawling(true);
      await this.setActionCrawl(type);

      const response = await this.handleCrawlSlugs();

      if (response?.status) {
        this.logProgress(
          '✅ Đã hoàn thành việc thu thập slug, bắt đầu thu thập phim...\n',
        );
      }

      let slugsNeedCrawl: string[] = [];

      if (type === 'create') {
        this.logProgress('🚀 Bắt đầu quá trình thu thập phim mới...\n');
        slugsNeedCrawl = await this.findSlugNotInMovies();
      } else if (type === 'update') {
        this.logProgress('🚀 Bắt đầu quá trình cập nhật lại tất cả phim...\n');
        slugsNeedCrawl = await this.getAllSlugs();
      }

      console.log('Tổng số phim cần thu thập:', slugsNeedCrawl);

      if (slugsNeedCrawl?.length === 0) {
        this.logProgress('🎉 Không còn phim để crawl');
        return {
          status: '🎉 Không còn phim để crawl',
        };
      }

      const limitFn = pLimit(limit);
      const totalPages = Math.ceil(slugsNeedCrawl.length / 100);

      console.log(`
========= TRẠNG THÁI CÀO PHIM =========\n
⚡ Số phim xử lý mỗi lần: ${limit}\n
📌 Tổng số phim cần thu thập: ${slugsNeedCrawl.length}\n
📄 Tổng số trang cần thu thập: ${totalPages}\n
=======================================
`);

      for (let j = 1; j <= totalPages; j++) {
        const isCrawling = await this.handleCheckIsCrawling();

        if (!isCrawling) {
          this.logProgress('⏸️ Quá trình cào phim đã bị tạm dừng.');
          return { status: 'Quá trình cào phim đã bị tạm dừng.' };
        }

        const slugs: string[] = slugsNeedCrawl.slice((j - 1) * 100, j * 100); // j = 1 -> 0-99, j=2 -> 100-199

        await this.crawlMoviesInPage(j, totalPages, slugs, limitFn);
      }

      this.logProgress('🎉 Đã thu thập xong tất cả phim trong danh sách.');

      return {
        status: '🎉 Đã hoàn tất quá trình crawl phim.',
      };
    } catch (error) {
      this.logProgress('>>> Lỗi khi crawl các phim:' + error);
      return {
        status: '❌ Lỗi khi crawl các phim.',
      };
    } finally {
      await this.setIsCrawling(false);
      await this.setActionCrawl(null);
      this.crawlGateway.notifyCrawlStatus(false);
    }
  }
}
