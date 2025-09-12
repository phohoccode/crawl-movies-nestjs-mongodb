import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CountryDocument = HydratedDocument<Country>;

@Schema({ _id: false })
export class Country {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
