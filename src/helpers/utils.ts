/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export function getTimeStamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `[${hours}:${minutes}:${seconds}]`;
}
