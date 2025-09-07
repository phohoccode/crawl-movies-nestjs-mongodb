/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MovieType } from '@/modules/movies/types/movie.type';

export function showInfoCrawl(
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

export function getPages(startPage: number, totalPages: number): number[] {
  return Array.from(
    { length: totalPages - startPage + 1 },
    (_, i) => startPage + i,
  );
}
