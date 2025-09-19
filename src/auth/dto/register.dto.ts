import type { TypeAccount } from '@/modules/users/types/user.type';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ValidateIf((obj: RegisterDto) => obj.type_account === 'credentials')
  @IsNotEmpty({ message: 'Email không được để trống!' })
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  email: string;

  @ValidateIf((obj: RegisterDto) => obj.type_account === 'credentials')
  @IsNotEmpty({ message: 'Mật khẩu không được để trống!' })
  @IsString({
    message: 'Mật khẩu phải là chuỗi ký tự!',
  })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự!' })
  @MaxLength(20, { message: 'Mật khẩu tối đa 20 ký tự!' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Mật khẩu phải chứa chữ hoa, chữ thường và số hoặc ký tự đặc biệt!',
  })
  password: string;

  @IsNotEmpty({ message: 'Tên người dùng không được để trống!' })
  @IsString({ message: 'Tên người dùng phải là chuỗi ký tự!' })
  username: string;

  @IsNotEmpty({ message: 'Avatar không được để trống!' })
  @IsString({ message: 'Avatar phải là chuỗi ký tự!' })
  avatar: string;

  @IsNotEmpty({ message: 'Loại tài khoản không được để trống!' })
  @IsString({ message: 'Loại tài khoản phải là chuỗi ký tự!' })
  @IsIn(['credentials', 'google'], { message: 'Loại tài khoản không hợp lệ!' })
  type_account: TypeAccount;
}
