import { Controller, Get } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('startCrawlMovies')
  startCrawlMovies() {
    return this.moviesService.handleStartCrawlMovies();
  }

  @Get('startCrawlSlugs')
  startCrawlSlugs() {
    return this.moviesService.handleStartCrawlSlugs();
  }

  @Get('initializeCrawlStatus')
  initializeCrawlStatus() {
    return this.moviesService.initializeCrawlStatus();
  }
}
