import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TypeAccount, IUser, Status } from './types/user.type';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hashPassword } from '@/helpers/utils';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findUserByEmailAndTypeAccount(email: string, typeAccount: TypeAccount) {
    try {
      return await this.userModel
        .findOne({ email, type_account: typeAccount })
        .lean() // Trả về một đối tượng JavaScript thuần túy, không phải một tài liệu Mongoose
        .exec(); // .exec() để trả về một Promise
    } catch (error) {
      console.log('>>> check error findUserByEmailAndTypeAccount', error);
      return null;
    }
  }

  async createUser(user: IUser) {
    try {
      const { type_account, password } = user;

      let passwordHashed: string = '';

      if (type_account === 'credentials' && password) {
        passwordHashed = await hashPassword(password);
      }

      return await this.userModel.create({
        ...user,
        password:
          type_account === 'credentials' ? passwordHashed : 'phohoccode',
      });
    } catch (error) {
      console.log('>>> check error createUser', error);

      if (error.code === 11000) {
        throw new ConflictException('Email đã tồn tại!');
      }

      throw new InternalServerErrorException('Không thể tạo user');
    }
  }

  async updateStatusUser(userId: string, status: Status) {
    try {
      const user = await this.userModel
        .findOneAndUpdate(
          { user_id: userId },
          { status },
          { new: true }, // Trả về document đã được cập nhật
        )
        .lean()
        .exec();

      if (!user) {
        throw new InternalServerErrorException('User không tồn tại');
      }

      const { password, ...result } = user;

      return result;
    } catch (error) {
      console.log('>>> check error updateStatusUser', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái user',
      );
    }
  }
}
