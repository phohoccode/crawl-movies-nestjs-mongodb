import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from '@/modules/movies/schemas/movie.schema';
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
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
