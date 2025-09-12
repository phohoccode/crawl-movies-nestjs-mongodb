import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ _id: false })
export class Category {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
