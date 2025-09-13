/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  CategoriesArrayWithAll,
  CountriesArrayWithAll,
  generateMetaData,
} from '@/modules/movies/constants/movie.contant';
import { EpisodeDto } from '@/modules/movies/dto/create-movie.dto';
import {
  Category,
  Country,
  MovieType,
} from '@/modules/movies/types/movie.type';
import slugify from 'slugify';

/**
 *
 * @param pageNumber là số trang hiện tại
 * @param slugs  là mảng các slug phim trên trang hiện tại
 * @param results  là mảng kết quả từ việc crawl từng slug phim
 */

export function logCrawlStats(
  pageNumber: number,
  slugs: string[],
  results: any[],
) {
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

/**
 *
 * @param startPage là trang bắt đầu
 * @param totalPages  là tổng số trang
 * @returns  trả về mảng các số trang từ startPage đến totalPages
 */

export function getPages(startPage: number, totalPages: number): number[] {
  return Array.from(
    { length: totalPages - startPage + 1 },
    (_, i) => startPage + i,
  );
}

/**
 *
 * @param ms là số mili giây cần nghỉ
 * @returns  trả về một Promise sau khi đã nghỉ xong
 */

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 *
 * @param url là đường dẫn API cần fetch
 * @param retries  là số lần thử lại khi fetch thất bại, mặc định là 3
 * @param logProgress  là hàm để ghi log tiến trình
 * @param options  là các tùy chọn cho fetch, có thể bao gồm method, headers, body, v.v.
 * @returns  trả về dữ liệu JSON nếu fetch thành công, nếu không sẽ thử lại theo số lần đã định
 */
export async function fetchWithRetry(
  url: string,
  retries: number = 3,
  logProgress: (message: string) => void,
  options?: RequestInit & { slug?: string },
) {
  for (let i = 0; i < retries; i++) {
    try {
      const timeSleep = Math.pow(2, i) * 1000;
      const response = await fetch(url, options);

      if (!response.ok) {
        logProgress(
          `❌ Fetch ${options?.slug} thất bại với status ${response.status}. Thử lại lần ${i + 1}/${retries}`,
        );
        logProgress(`⏳Nghỉ ${timeSleep / 1000}s trước khi thử lại...`);
        await sleep(timeSleep);
        continue;
      }

      const data = await response.json();

      return data;
    } catch (error) {
      logProgress(
        `❌Fetch thất bại Thử lại lần ${i + 1}/${retries} - Lỗi: ${error}`,
      );
      await sleep(1000);
      continue;
    }
  }
}

/**
 *  Lấy timestamp hiện tại theo định dạng [hh:mm:ss]
 * @returns trả về timestamp hiện tại theo định dạng [hh:mm:ss]
 */

export function getTimeStamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `[${hours}:${minutes}:${seconds}]`;
}

/**
 *
 * @param type là loại phim, quốc gia hoặc thể loại
 * @returns  trả về tiêu đề và mô tả tương ứng
 */

export function generateMetaDataFn(type: MovieType | Country | Category) {
  const meta = generateMetaData[type];

  if (!meta) {
    return {
      titleHead: 'PHOFLIX-V3 - Xem phim online miễn phí',
      descriptionHead:
        'Xem phim chất lượng cao, miễn phí, cập nhật nhanh nhất tại PHOFLIX-V3.',
    };
  }

  return {
    titleHead: meta.title,
    descriptionHead: meta.description,
  };
}

/**
 * Lấy danh sách các poster_url từ mảng phim
 * @param movies là mảng các phim
 * @returns   trả về mảng các poster_url
 */

export function generateImageFromMovies(movies: any[]) {
  return movies.map((movie) => {
    return movie.poster_url;
  });
}

/**
 * Lấy giá trị từ kết quả của Promise.allSettled
 * @param result là kết quả trả về từ Promise.allSettled
 * @returns nếu trạng thái là 'fulfilled' thì trả về value, ngược lại trả về null
 */

export function getValueByPromiseAllSettled<T>(
  result: PromiseSettledResult<T>,
) {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  return null;
}

/**
 * Chuẩn hóa chuỗi
 * @param str là chuỗi cần chuẩn hóa
 * @returns trả về chuỗi đã chuẩn hóa ví dụ "Phở" => "Pho"
 */
export function normalize(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function mapCountriesOrCategories(
  slugs: Country[],
  type: 'country',
): {
  id: string;
  name: string;
  slug: Country;
}[];
export function mapCountriesOrCategories(
  slugs: Category[],
  type: 'category',
): {
  id: string;
  name: string;
  slug: Category;
}[];
export function mapCountriesOrCategories(
  slugs: (Country | Category)[],
  type: 'country' | 'category',
) {
  const arrayToMap =
    type === 'country' ? CountriesArrayWithAll : CategoriesArrayWithAll;

  return slugs.map((slug) => {
    const item = arrayToMap.find((item) => item.slug === slug);
    return item || { id: '', name: 'Unknown', slug };
  });
}

export function generateSlug(name: string) {
  return slugify(name, {
    lower: true, // viết thường hết
    strict: true, // bỏ ký tự đặc biệt
    locale: 'vi', // hỗ trợ tiếng Việt
  });
}

export function mapEpisodesToEpisodeDataDto(
  episodes: EpisodeDto[],
  movieName: string,
) {
  return episodes?.map((ep) => {
    const serverData = ep.server_data?.map((server) => {
      return {
        name: server.name,
        link_m3u8: server.link_m3u8,
        slug: generateSlug(server.name || 'unknown'),
        filename: `${movieName} - ${server.name}`,
        link_embed: `https://player.phimapi.com/player/?url=${server.link_m3u8}`,
      };
    });

    return {
      server_name: ep.server_name,
      server_data: serverData || [],
    };
  });
}
