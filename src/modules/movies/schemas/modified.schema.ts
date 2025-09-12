import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModifiedDocument = HydratedDocument<Modified>;

@Schema({ _id: false })
export class Modified {
  @Prop({ type: String, default: () => new Date().toISOString() })
  time: string;
}

export const ModifiedSchema = SchemaFactory.createForClass(Modified);
