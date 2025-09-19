import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Gender, Role, Status, TypeAccount } from '../types/user.type';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: 'credentials' })
  type_account: TypeAccount;

  @Prop({ default: 'other' })
  gender: Gender;

  @Prop({ default: 'pending' })
  status: Status;

  @Prop({ default: 'member' })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
