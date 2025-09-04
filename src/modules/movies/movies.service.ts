/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Slug, SlugDocument } from './schemas/slug.schema';
import {
  CrawlStatus,
  CrawlStatusDocument,
  MovieType,
} from './schemas/crawl-status.schema';
import pLimit from 'p-limit';
import { movieType } from './constants/movies.constants';

@Injectable()
export class MoviesService {
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

  async fetchDataMovie(type: MovieType, limit = 64, page = 1, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const resDataMovies = await fetch(
          `${this.apiUrl}/v1/api/danh-sach/${type}?limit=${limit}&page=${page}`,
        );

        if (!resDataMovies.ok) {
          console.log(
            `❌ API trả về lỗi ${resDataMovies.status} khi lấy danh sách phim. Thử lại (${attempt}/${retries})...`,
          );
          await this.sleep(1000); // chờ 1s trước khi thử lại
          continue;
        }

        const dataMovies = await resDataMovies.json();
        return dataMovies?.data ?? null; // rõ ràng hơn
      } catch (error) {
        console.log(`>>> Lỗi khi lấy dữ liệu phim (lần ${attempt}):`, error);
        await this.sleep(1000); // thêm delay trước khi retry
        continue;
      }
    }

    // Sau khi thử đủ số lần mà vẫn lỗi thì trả về null
    return null;
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

  async fetchMovieDetail(slug: string, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${this.apiUrl}/phim/${slug}`);

        if (!res.ok) {
          console.log(
            `❌ API trả về lỗi ${res.status} cho slug: ${slug}. Thử lại (${attempt}/${retries})...`,
          );
          await this.sleep(1000);
          continue;
        }

        const text = await res.text();

        try {
          return JSON.parse(text);
        } catch {
          console.log(
            `❌ Không parse được JSON cho slug: ${slug} (lần ${attempt}/${retries}). Nghỉ 1s...`,
          );
          await this.sleep(1000);
          continue;
        }
      } catch (err: any) {
        console.log(
          `❌ Lỗi fetch slug ${slug} (lần ${attempt}/${retries}):`,
          err.message,
          'Nghỉ 1s...',
        );
        await this.sleep(1000);
        continue;
      }
    }

    // Nếu thử đủ retries mà vẫn thất bại
    return null;
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

    console.log(`\n📌 Trang ${pageNumber} hoàn thành`);
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

      return {
        status: 'Đã thu thập xong tất cả slug trong danh sách.',
      };
    } catch (error) {
      console.error('❌ Lỗi khi crawl slug:', error);
      return { status: 'Thu nhập slug thất bại!' };
    }
  }

  async handleStartCrawlMovies() {
    try {
      const crawStatus = await this.fetchCrawlStatus();
      const { arrHasCrawled, arrNotCrawled } = this.movieHasCrawled(
        crawStatus?.movieTypes || [],
      );

      if (arrHasCrawled?.length === this.movieTypes?.length) {
        return { status: '✅ Tất cả các loại phim đã được thu thập.' };
      }

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

        const limit = pLimit(10);

        for (let j = crawStatus?.currentPage || 1; j <= totalPages; j++) {
          console.log(
            `📄 ===== Đang thu thập trang ${j} / ${totalPages} =====`,
          );

          const slugs = await this.fetchSlugs(100, j, type);

          const tasks = slugs.map((slug, i) =>
            limit(async () => {
              try {
                const movieDetail = await this.fetchMovieDetail(slug, 1);

                if (!movieDetail) {
                  return { slug, status: 'not_found' };
                }

                const isNew = await this.saveMovieToDb(movieDetail);

                if (isNew) {
                  console.log(
                    `✅ [${i + 1}/${slugs.length}] Lưu phim: ${movieDetail.movie.name}`,
                  );
                } else {
                  console.log(
                    `⚠️ [${i + 1}/${slugs.length}] Phim đã tồn tại: ${movieDetail.movie.name}`,
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

          console.log('⏳ Delay 3s để tránh quá tải server...');
          await this.sleep(3000);
        }

        // Cập nhật loại phim đã thu thập xong
        const updated = await this.updateMovieTypesInCrawlStatus(type);

        if (updated) {
          console.log(`🎉 Hoàn tất thu thập phim cho loại: ${type}`);
          console.log(
            '⏳ Delay 3s trước khi chuyển sang loại phim tiếp theo...',
          );
          await this.sleep(3000);
        } else {
          console.log(`❌ Không thể cập nhật trạng thái cho loại phim ${type}`);
          continue;
        }
      }

      return {
        status: '✅ Đã thu thập xong tất cả phim trong danh sách slug.',
      };
    } catch (error) {
      console.error('❌ Lỗi tổng quát khi crawl phim:', error);
      return { status: 'Thu thập thông tin phim thất bại!' };
    }
  }
}
