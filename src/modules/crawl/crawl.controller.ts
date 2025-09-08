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
      status: true,
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
    const action = await this.crawlService.checkActionCrawl();

    return {
      status: isCrawling ? 'Đang cào phim' : 'Đang tạm dừng',
      isCrawling,
      action,
    };
  }

  @Get('crawlMovies')
  async crawlMovies(@Query() query: CrawlMoviesDto) {
    const isCrawling = await this.crawlService.handleCheckIsCrawling();

    if (isCrawling) {
      return {
        status: false,
        isCrawling: true,
        message: 'Đang có một quá trình crawl khác, vui lòng thử lại sau.',
      };
    }

    this.crawlService
      .handleCrawlMovies(
        +(query.limit || 10),
        query.type as 'create' | 'update',
      )
      .then(() => console.log('🎉 Crawl Movies xong'))
      .catch((err) => console.error('🔥 Lỗi crawl Movies:', err));

    return {
      status: true,
      isCrawling: true,
      action: query.type,
      message: 'Đã bắt đầu quá trình crawl phim.',
    };
  }

  @Get('allCrawledMovies')
  async getAllCrawledMovies() {
    const allCrawledMovies = await this.crawlService.fetchTotalMovies();
    return {
      status: true,
      message: 'Lấy danh sách phim đã cào thành công.',
      data: {
        total: allCrawledMovies,
      },
    };
  }
}
