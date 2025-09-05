import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MovieType } from './crawl-status.schema';

export type SlugDocument = HydratedDocument<Slug>;

@Schema({ collection: 'slugs' })
export class Slug {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, enum: MovieType })
  type: MovieType;
}

export const SlugSchema = SchemaFactory.createForClass(Slug);
