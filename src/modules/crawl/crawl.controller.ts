import { Controller, Get } from '@nestjs/common';
import { CrawlService } from './crawl.service';

@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @Get('resetCrawlStatus')
  resetCrawlStatus() {
    return this.crawlService.handleResetCrawlStatus();
  }

  @Get('initializeCrawlStatus')
  initializeCrawlStatus() {
    return this.crawlService.initializeCrawlStatus();
  }

  @Get('crawlMovies')
  crawlMovies() {
    this.crawlService
      .handleCrawlMovies()
      .then(() => console.log('🎉 Crawl Movies xong'))
      .catch((err) => console.error('🔥 Lỗi crawl Movies:', err));

    return { message: 'Đã bắt đầu quá trình crawl phim.' };
  }
}
