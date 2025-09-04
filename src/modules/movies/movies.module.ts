import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schemas/movie.schema';
import { Slug, SlugSchema } from './schemas/slug.schema';
import { CrawlStatus, CrawlStatusSchema } from './schemas/crawl-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Movie.name, schema: MovieSchema },
      { name: Slug.name, schema: SlugSchema },
      { name: CrawlStatus.name, schema: CrawlStatusSchema },
    ]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
