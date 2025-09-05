import { Controller, Get } from '@nestjs/common';
import { CrawlService } from './crawl.service';

@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @Get('startCrawlMovies')
  async startCrawlMovies() {
    const isCrawling = await this.crawlService.checkIsCrawling();

    // if (isCrawling) {
    //   return {
    //     status: '⚠️ Đang có một tiến trình crawl đang chạy, vui lòng đợi!',
    //   };
    // }

    this.crawlService
      .handleStartCrawlMovies()
      .then(() => console.log('🎉 Crawl xong'))
      .catch((err) => console.error('🔥 Lỗi crawl:', err));

    return { message: 'Đã bắt đầu quá trình crawl movies.' };
  }

  @Get('resetCrawlStatus')
  resetCrawlStatus() {
    return this.crawlService.handleResetCrawlStatus();
  }

  @Get('startCrawlSlugs')
  async startCrawlSlugs() {
    const isCrawling = await this.crawlService.checkIsCrawling();

    if (isCrawling) {
      return {
        status: '⚠️ Đang có một tiến trình crawl đang chạy, vui lòng đợi!',
      };
    }

    this.crawlService
      .handleStartCrawlSlugs()
      .then(() => console.log('🎉 Crawl Slugs xong'))
      .catch((err) => console.error('🔥 Lỗi crawl Slugs:', err));

    return { message: 'Đã bắt đầu quá trình crawl slugs.' };
  }

  @Get('initializeCrawlStatus')
  initializeCrawlStatus() {
    return this.crawlService.initializeCrawlStatus();
  }
}
