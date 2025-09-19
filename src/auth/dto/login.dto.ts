import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email không được để trống!' })
  @IsEmail({}, { message: 'Email không hợp lệ!' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự!' })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự!' })
  @MaxLength(20, { message: 'Mật khẩu tối đa 20 ký tự!' })
  password: string;

  @IsString({ message: 'Loại tài khoản phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Loại tài khoản không được để trống!' })
  @IsIn(['credentials', 'google'], { message: 'Loại tài khoản không hợp lệ!' })
  type_account: string;
}
