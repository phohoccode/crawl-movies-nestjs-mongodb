/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
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
import {
  fetchWithRetry,
  getPages,
  getTimeStamp,
  logCrawlStats,
  sleep,
} from '@/helpers/utils';
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

  async fetchMovieDetail(slug: string) {
    const url = `${this.apiUrl}/phim/${slug}`;
    const logProgress = (message: string) => this.logProgress(message);
    const data = await fetchWithRetry(url, 3, logProgress, { slug });
    return data || null;
  }

  async fetchDataMovie(type: MovieType, limit = 64, page = 1) {
    const url = `${this.apiUrl}/v1/api/danh-sach/${type}?limit=${limit}&page=${page}`;
    const logProgress = (message: string) => this.logProgress(message);
    const data = await fetchWithRetry(url, 3, logProgress, { slug: type });
    return data || null;
  }

  // Phân loại các loại phim đã và chưa được crawl
  handleGroupMovieTypesByCrawl(movieTypesFromDb: MovieType[]) {
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

  logProgress(message: string) {
    const timeStamp = getTimeStamp();
    const logMessage = `${timeStamp} ${message}`;

    console.log(logMessage);
    this.crawlGateway.sendProgress(logMessage);
  }

  async handleUpdateMovieTypesInCrawStatus(newType: MovieType) {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne();

      if (!crawlStatus) {
        this.logProgress('❌ Trạng thái cào không tồn tại.');
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
          },
        );

        return result.modifiedCount > 0;
      } else {
        this.logProgress(
          '⚠️ Loại phim đã được cào hoặc không hợp lệ:' + newType,
        );
        return false;
      }
    } catch (error) {
      this.logProgress(' Lỗi khi cập nhật loại phim đã cào:' + error);
      return false;
    }
  }

  async handleGetCrawlStatus() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus;
    } catch (error) {
      this.logProgress(' Lỗi khi lấy trạng thái cào:' + error);
      return null;
    }
  }

  async handleResetCrawlStatus() {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        {
          movieTypes: [],
          selectedType: MOVIE_TYPE[0],
          currentPage: 1,
          isCrawling: false,
          action: null,
          totalUpdatedMovies: 0,
        },
        { upsert: true },
      );

      return result.modifiedCount > 0 || !!result.upsertedId;
    } catch (error) {
      this.logProgress(' Lỗi khi đặt lại trạng thái cào:' + error);
      return false;
    }
  }

  async handleGetAllSlug() {
    try {
      const result = await this.slugModel.find().lean();

      return result.map((item) => item.slug);
    } catch (error) {
      this.logProgress(' Lỗi khi lấy tất cả slug:' + error);
      return [];
    }
  }

  async handleUpsertMovie(data: any) {
    try {
      const movieId = data?.movie?._id;

      // Xoá trường _id để tránh lỗi khi upsert
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

      // Cập nhật tổng số phim đã cập nhật nếu có thay đổi
      if (result?.modifiedCount > 0) {
        await this.crawlStatusModel.updateOne(
          {},
          { $inc: { totalUpdatedMovies: 1 } },
        );
      }

      return result?.upsertedCount > 0 || result?.modifiedCount > 0;
    } catch (error) {
      this.logProgress(' Lỗi khi lưu phim vào cơ sở dữ liệu:' + error);
      return false;
    }
  }

  // Kiểm tra xem có đang trong trạng thái crawling không
  async handleCheckIsCrawling() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus?.isCrawling || false;
    } catch (error) {
      this.logProgress(' Lỗi khi kiểm tra trạng thái crawling:' + error);
      return false;
    }
  }

  // Đặt trạng thái isCrawling
  async handleSetIsCrawing(value: boolean) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { isCrawling: value } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.logProgress(' Lỗi khi cập nhật trạng thái crawling:' + error);
      return false;
    }
  }

  async handleSetActionCrawl(action: 'create' | 'update' | null) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { action } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.logProgress(' Lỗi khi cập nhật hành động crawl:' + error);
      return false;
    }
  }

  async handleCheckActionCrawl() {
    try {
      const crawlStatus = await this.crawlStatusModel.findOne().lean();
      return crawlStatus?.action || null;
    } catch (error) {
      this.logProgress(' Lỗi khi kiểm tra hành động crawl:' + error);
      return null;
    }
  }

  async handleFindSlugNoInMovies() {
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
      this.logProgress(' Lỗi khi tìm slug chưa có trong movies:' + error);
      return [];
    }
  }

  async handleUpCurrentPageInCrawlStatus(page: number) {
    try {
      const result = await this.crawlStatusModel.updateOne(
        {},
        { $set: { currentPage: page } },
        { upsert: true },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.logProgress(
        ' Lỗi khi cập nhật trang hiện tại trong trạng thái cào:' + error,
      );
      return false;
    }
  }

  async handleGetTotalMovies() {
    try {
      const result = await this.movieModel.countDocuments();
      return result;
    } catch (error) {
      this.logProgress(' Lỗi khi lấy tổng số phim:' + error);
      return 0;
    }
  }

  async handleCrawlSlugsFromPage(
    j: number,
    totalPages: number,
    type: MovieType,
  ) {
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

      this.logProgress(`📄 Đang cào phim tại trang ${j} / ${totalPages}`);

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
      await this.handleUpCurrentPageInCrawlStatus(j);
    } catch (error) {
      this.logProgress(' Lỗi khi crawl slug trong trang:' + error);
      return;
    }
  }

  async handleCrawlSlugs() {
    try {
      await this.handleSetIsCrawing(true);

      const crawStatus = await this.handleGetCrawlStatus();
      const { arrHasCrawled, arrNotCrawled } =
        this.handleGroupMovieTypesByCrawl(crawStatus?.movieTypes || []);

      if (arrHasCrawled?.length === MOVIE_TYPE?.length) {
        this.logProgress('✅ Tất cả các loại slug đã được cào.');

        return {
          status: true,
          message: 'Tất cả các slug đã được cào.',
        };
      }

      this.logProgress('🚀 Bắt đầu quá trình cào slug phim...\n');

      for (let i = 0; i < arrNotCrawled.length; i++) {
        const isCrawling = await this.handleCheckIsCrawling();

        if (!isCrawling) {
          this.logProgress('⏸️ Quá trình cào đã bị tạm dừng.');
          return { status: false, message: 'Quá trình cào đã bị tạm dừng.' };
        }

        const type = arrNotCrawled[i];
        const crawStatus = await this.handleGetCrawlStatus();

        // Lấy thông tin phân trang
        const response = await this.fetchDataMovie(
          type || MovieType.PHIM_BO,
          this.limit,
          crawStatus?.currentPage || 1,
        );

        if (!response?.status) {
          this.logProgress(
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
              this.logProgress('⏸️ Quá trình cào đã bị tạm dừng.');

              return { status: 'Quá trình cào đã bị tạm dừng.' };
            }

            await this.handleCrawlSlugsFromPage(currentPage, totalPages, type);

            this.logProgress(`⏳ Delay 300ms trước khi qua trang tiếp theo...`);
            await sleep(300);
          });
        });

        if (!tasks || tasks.length === 0) {
          this.logProgress(`⚠️ Loại phim ${type} không có trang nào để cào.`);
          continue;
        }

        await Promise.allSettled(tasks);

        // Cập nhật loại phim đã cào xong
        const updated = await this.handleUpdateMovieTypesInCrawStatus(type);

        if (updated) {
          this.logProgress(
            `🎉 Đã cào xong tất cả slug cho loại phim: ${type}\n`,
          );
          this.logProgress(
            '⏳ Delay 3s trước khi chuyển sang loại phim tiếp theo...',
          );

          await sleep(3000);
        } else {
          this.logProgress(
            `❌ Thu thập slug cho loại phim ${type} nhưng không thể cập nhật trạng thái.\n`,
          );
          continue;
        }
      }

      this.logProgress('🎉 Đã cào xong tất cả slug trong danh sách.');

      return {
        status: true,
        message: 'Đã cào xong tất cả slug trong danh sách.',
      };
    } catch (error) {
      this.logProgress('❌ Lỗi khi crawl slug:' + error);
      return { status: 'Thu nhập slug thất bại!' };
    } finally {
      await this.handleSetIsCrawing(false);
    }
  }

  async handlePushSocketRefreshTotalMovies() {
    try {
      const response = await this.moviesService.getMoviesStats();
      const movieStats = response?.data || {};

      this.crawlGateway.refreshTotalMovies({
        totalMovies: movieStats.totalMovies || 0,
        totalUpdatedMovies: movieStats.totalUpdatedMovies || 0,
        totalSlugs: movieStats.totalSlugs || 0,
        totalSeries: movieStats.totalSeries || 0,
        totalSingles: movieStats.totalSingles || 0,
        totalCinemas: movieStats.totalCinemas || 0,
        totalTVShows: movieStats.totalTVShows || 0,
        totalAnimations: movieStats.totalAnimations || 0,
        totalDubbedMovies: movieStats.totalDubbedMovies || 0,
        totalSubtitledMovies: movieStats.totalSubtitledMovies || 0,
        totalVoiceDubbedMovies: movieStats.totalVoiceDubbedMovies || 0,
      });

      return true;
    } catch (error) {
      this.logProgress(' Lỗi khi gửi socket cập nhật tổng số phim:' + error);
      return false;
    }
  }

  async handleCrawlMoviesFromPage(
    j: number,
    totalPages: number,
    slugs: string[],
    limit: any,
    type: 'create' | 'update' = 'create',
  ) {
    this.logProgress(`📄 Đang cào phim tại trang ${j} / ${totalPages}`);

    if (!slugs || slugs.length === 0) {
      this.logProgress(
        `⚠️ Trang ${j} không có slug nào để cào. Bỏ qua sau 300ms...\n`,
      );
      await sleep(300);
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

          const isNew = await this.handleUpsertMovie(movieDetail);
          const progress = `${i + 1}/${slugs.length}`;
          const movieName = movieDetail?.movie?.name || 'N/A';

          if (isNew) {
            this.logProgress(
              `✅ [${progress}] Phim: ${movieName} đã được ${type === 'create' ? 'thêm mới' : 'cập nhật'} vào hệ thống`,
            );
          } else {
            this.logProgress(
              `⚠️ [${progress}] Phim ${movieName} ${type === 'create' ? 'đã tồn tại trong hệ thống' : 'chưa có sự thay đổi'} `,
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

    // Cập nhật lại tổng số phim sau mỗi trang
    await this.handlePushSocketRefreshTotalMovies();

    if (j < totalPages) {
      this.logProgress('⏳ Delay 3s trước khi qua trang tiếp theo...');
      await sleep(3000);
    }
  }

  async handleCrawlMovies(limit: number, type: 'create' | 'update' = 'create') {
    try {
      const response = await this.handleCrawlSlugs();

      console.log('>>> response:', response);

      if (response?.status) {
        this.logProgress(
          '✅ Đã hoàn thành việc cào slug, bắt đầu cào phim...\n',
        );
      }

      // Đánh dấu đang trong trạng thái crawling
      await this.handleSetIsCrawing(true);
      await this.handleSetActionCrawl(type);

      let slugsNeedCrawl: string[] = [];

      if (type === 'create') {
        this.logProgress('🚀 Bắt đầu quá trình thu cào phim mới...\n');
        slugsNeedCrawl = await this.handleFindSlugNoInMovies();
      } else if (type === 'update') {
        this.logProgress('🚀 Bắt đầu quá trình cập nhật lại tất cả phim...\n');
        slugsNeedCrawl = await this.handleGetAllSlug();
      }

      if (slugsNeedCrawl?.length === 0) {
        this.logProgress('🎉 Không còn phim để cào');
        return {
          status: '🎉 Không còn phim để crawl',
        };
      }

      const limitFn = pLimit(limit);
      const totalPages = Math.ceil(slugsNeedCrawl.length / 100);

      console.log(`
========= TRẠNG THÁI CÀO PHIM =========\n
⚡ Số phim xử lý mỗi lần: ${limit}\n
📌 Tổng số phim cần cào: ${slugsNeedCrawl.length}\n
📄 Tổng số trang cần cào: ${totalPages}\n
=======================================
`);

      for (let j = 1; j <= totalPages; j++) {
        const isCrawling = await this.handleCheckIsCrawling();

        if (!isCrawling) {
          this.logProgress('⏸️ Quá trình cào phim đã bị tạm dừng.');
          return { status: 'Quá trình cào phim đã bị tạm dừng.' };
        }

        const slugs: string[] = slugsNeedCrawl.slice((j - 1) * 100, j * 100); // j = 1 -> 0-99, j=2 -> 100-199

        await this.handleCrawlMoviesFromPage(
          j,
          totalPages,
          slugs,
          limitFn,
          type,
        );
      }

      this.logProgress('🎉 Đã cào xong tất cả phim trong danh sách.');

      return {
        status: '🎉 Đã hoàn tất quá trình crawl phim.',
      };
    } catch (error) {
      this.logProgress(' Lỗi khi crawl các phim:' + error);
      return {
        status: '❌ Lỗi khi crawl các phim.',
      };
    } finally {
      await this.handleSetIsCrawing(false);
      await this.handleSetActionCrawl(null);
      this.crawlGateway.notifyCrawlStatus(false);
    }
  }
}
