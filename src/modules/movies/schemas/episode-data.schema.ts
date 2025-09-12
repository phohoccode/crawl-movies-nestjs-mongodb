import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EpisodeDataDocument = HydratedDocument<EpisodeData>;

@Schema({ _id: false })
export class EpisodeData {
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

export const EpisodeDataSchema = SchemaFactory.createForClass(EpisodeData);
