import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TmdbDocument = HydratedDocument<Tmdb>;

@Schema({ _id: false })
export class Tmdb {
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

export const TmdbSchema = SchemaFactory.createForClass(Tmdb);
