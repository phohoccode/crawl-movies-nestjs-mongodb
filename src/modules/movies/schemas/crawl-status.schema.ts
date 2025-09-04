import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CrawlStatusDocument = HydratedDocument<CrawlStatus>;

export enum MovieType {
  PHIM_BO = 'phim-bo',
  PHIM_LE = 'phim-le',
  HOAT_HINH = 'hoat-hinh',
  TV_SHOWS = 'tv-shows',
  // PHIM_CHIEU_RAP = 'phim-chieu-rap',
  // PHIM_VIETSUB = 'phim-vietsub',
  // PHIM_THUYET_MINH = 'phim-thuyet-minh',
  // PHIM_LONG_TIENG = 'phim-long-tieng',
}

@Schema({ collection: 'crawl_status' })
export class CrawlStatus {
  @Prop({ type: [String], enum: MovieType, default: [] })
  movieTypes: MovieType[];

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
