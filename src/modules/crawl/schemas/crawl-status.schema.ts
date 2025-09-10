import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MovieType } from '../constants/crawl.constants';

export type CrawlStatusDocument = HydratedDocument<CrawlStatus>;

@Schema({ collection: 'crawl_status' })
export class CrawlStatus {
  @Prop({ type: [String], enum: MovieType, default: [] })
  movieTypes: MovieType[];

  @Prop({ type: Boolean, default: false })
  isCrawling: boolean;

  @Prop({ type: String, default: null })
  action: 'create' | 'update' | null;

  @Prop({ default: MovieType.PHIM_BO })
  selectedType: MovieType;

  @Prop({ default: 1 })
  currentPage: number;

  @Prop({ type: Number, default: 0 })
  totalUpdatedMovies: number;
}

export const CrawlStatusSchema = SchemaFactory.createForClass(CrawlStatus);
