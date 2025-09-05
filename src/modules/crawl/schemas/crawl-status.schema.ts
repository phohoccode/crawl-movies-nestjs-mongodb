import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CrawlStatusDocument = HydratedDocument<CrawlStatus>;

export enum MovieType {
  PHIM_BO = 'phim-bo',
  PHIM_LE = 'phim-le',
  HOAT_HINH = 'hoat-hinh',
  TV_SHOWS = 'tv-shows',
}

@Schema({ collection: 'crawl_status' })
export class CrawlStatus {
  @Prop({ type: [String], enum: MovieType, default: [] })
  movieTypes: MovieType[];

  @Prop({ type: Boolean, default: false })
  isCrawling: boolean;

  @Prop({ type: Boolean, default: false })
  shouldStop: boolean;

  @Prop({ default: MovieType.PHIM_BO })
  selectedType: MovieType;

  @Prop({ default: 1 })
  currentPage: number;

  @Prop({ default: 0 })
  totalMovies: number;

  @Prop({ default: 0 })
  totalPages: number;
}

export const CrawlStatusSchema = SchemaFactory.createForClass(CrawlStatus);
