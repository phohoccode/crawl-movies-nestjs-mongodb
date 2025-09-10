import { forwardRef, Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { Movie, MovieSchema } from '@/modules/movies/schemas/movie.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlModule } from '../crawl/crawl.module';
import { Slug, SlugSchema } from '../crawl/schemas/slug.schema';
import {
  CrawlStatus,
  CrawlStatusSchema,
} from '../crawl/schemas/crawl-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema,
      },
      {
        name: Slug.name,
        schema: SlugSchema,
      },
      {
        name: CrawlStatus.name,
        schema: CrawlStatusSchema,
      },
    ]),

    forwardRef(() => CrawlModule),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
