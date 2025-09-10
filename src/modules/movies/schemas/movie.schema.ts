import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovieDocument = HydratedDocument<Movie>;

class Tmdb {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: Number })
  season: number;

  @Prop({ type: Number })
  vote_average: number;

  @Prop({ type: Number })
  vote_count: number;
}

class Category {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;
}

class Country {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;
}

class EpisodeData {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;

  @Prop({ type: String })
  filename: string;

  @Prop({ type: String })
  link_embed: string;

  @Prop({ type: String })
  link_m3u8: string;
}

class Episode {
  @Prop({ type: String })
  server_name: string;

  @Prop({ type: [EpisodeData] })
  server_data: EpisodeData[];
}

class Modified {
  @Prop({ type: String })
  time: string;
}

@Schema({ collection: 'movies' })
export class Movie {
  @Prop({ type: Tmdb, required: true })
  tmdb: Tmdb;

  @Prop({ type: String, required: true, unique: true })
  movie_id: string;

  @Prop({ type: String, required: true, unique: true })
  slug: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  origin_name: string;

  @Prop({ type: Boolean })
  is_cinema: boolean;

  @Prop({ type: Boolean })
  sub_docquyen: boolean;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  poster_url: string;

  @Prop({ type: String })
  thumb_url: string;

  @Prop({ type: String })
  trailer_url: string;

  @Prop({ type: String })
  time: string;

  @Prop({ type: String })
  episode_current: string;

  @Prop({ type: String })
  episode_total: string;

  @Prop({ type: String })
  quality: string;

  @Prop({ type: String })
  lang: string;

  @Prop({ type: String || Number })
  year: string | number;

  @Prop({ type: [String] })
  actors: string[];

  @Prop({ type: [String] })
  directors: string[];

  @Prop({ type: [Category] })
  categories: Category[];

  @Prop({ type: [Country] })
  countries: Country[];

  @Prop({ type: [Episode] })
  episodes: Episode[];

  @Prop({ type: Modified })
  modified: Modified;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
