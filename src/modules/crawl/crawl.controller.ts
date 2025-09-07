import { Controller, Get, Query } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlMoviesDto } from '../movies/dto/crawl-movies.dto';

@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @Get('resetCrawlStatus')
  resetCrawlStatus() {
    return this.crawlService.handleResetCrawlStatus();
  }

  @Get('pauseCrawling')
  async pauseCrawling() {
    await this.crawlService.setIsCrawling(false);

    return {
      message: 'Đã tạm dừng quá trình thu thập.',
      isCrawling: false,
    };
  }

  @Get('crawlSlugs')
  crawlSlugs() {
    this.crawlService
      .handleCrawlSlugs()
      .then(() => console.log('🎉 Crawl Slugs xong'))
      .catch((err) => console.error('🔥 Lỗi crawl Slugs:', err));

    return {
      status: true,
      message: 'Đã bắt đầu quá trình crawl slugs.',
      isCrawling: true,
    };
  }

  @Get('checkIsCrawling')
  async checkIsCrawling() {
    const isCrawling = await this.crawlService.handleCheckIsCrawling();

    return {
      status: `${isCrawling} ? "Đang crawl" : "Đang tạm dừng"`,
      isCrawling,
    };
  }

  @Get('crawlMovies')
  crawlMovies(@Query() query: CrawlMoviesDto) {
    this.crawlService
      .handleCrawlMovies(+(query.limit || 10))
      .then(() => console.log('🎉 Crawl Movies xong'))
      .catch((err) => console.error('🔥 Lỗi crawl Movies:', err));

    return {
      status: true,
      isCrawling: true,
      message: 'Đã bắt đầu quá trình crawl phim.',
    };
  }
}
