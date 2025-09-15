import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Tmdb } from './tmdb.schema';
import { Category } from './category.schema';
import { Country } from './country.schema';
import { Episode } from './episode.schema';
import { Modified } from './modified.schema';

export type MovieDocument = HydratedDocument<Movie>;

@Schema({ collection: 'movies' })
export class Movie {
  @Prop({ type: String, required: true, unique: true })
  movie_id: string;

  @Prop({ type: String, required: true, unique: true })
  slug: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Tmdb })
  tmdb: Tmdb;

  @Prop({ type: String })
  origin_name: string;

  @Prop({ type: Boolean, default: false })
  is_cinema: boolean;

  @Prop({ type: Boolean, default: false })
  sub_docquyen: boolean;

  @Prop({ type: String, default: '' })
  content: string;

  @Prop({ type: String, default: '' })
  type: string;

  @Prop({ type: String, default: '' })
  poster_url: string;

  @Prop({ type: String, default: '' })
  thumb_url: string;

  @Prop({ type: String, default: '' })
  trailer_url: string;

  @Prop({ type: String, default: '' })
  time: string;

  @Prop({ type: String, default: '' })
  episode_current: string;

  @Prop({ type: String, default: '' })
  episode_total: string;

  @Prop({ type: String, default: '' })
  quality: string;

  @Prop({ type: String, default: '' })
  lang: string;

  @Prop({ type: Number, default: () => new Date().getFullYear() })
  year: number;

  @Prop({ type: [String], default: [] })
  actors: string[];

  @Prop({ type: [String], default: [] })
  directors: string[];

  @Prop({ type: [Category], default: [] })
  categories: Category[];

  @Prop({ type: [Country], default: [] })
  countries: Country[];

  @Prop({ type: [Episode], default: [] })
  episodes: Episode[];

  @Prop({ type: Modified, default: {} })
  modified: Modified;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
