import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EpisodeData } from './episode-data.schema';

export type EpisodeDocument = HydratedDocument<Episode>;

@Schema({ _id: false })
export class Episode {
  @Prop({ type: String })
  server_name: string;

  @Prop({ type: [EpisodeData] })
  server_data: EpisodeData[];
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);
