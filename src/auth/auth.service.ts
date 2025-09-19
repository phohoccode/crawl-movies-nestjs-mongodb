/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IUser } from './../modules/users/types/user.type';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '@/modules/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtStrategy } from './passport/jwt.strategy';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly clientUrl: string | null = null;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private jwtStrategy: JwtStrategy,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.clientUrl = this.configService.get<string>('CLIENT_URL') || null;
  }

  async validateUser(username: string, pass: string): Promise<any> {
    // const user = await this.usersService.findOne(username);
    // if (user && user.password === pass) {
    //   const { password, ...result } = user;
    //   return result;
    // }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(user: RegisterDto) {
    const { email, type_account, username, avatar, password } = user;

    const existingUser = await this.usersService.findUserByEmailAndTypeAccount(
      email,
      type_account,
    );

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng!');
    }

    const userId = uuidv4();
    const data = { email, username, avatar, type_account, user_id: userId };
    const token = this.jwtStrategy.encryptData(data, 60 * 30); // token có thời hạn 30 phút

    // Gửi email xác nhận nếu là tài khoản credentials
    if (user.type_account === 'credentials') {
      this.mailerService
        .sendMail({
          to: email,
          from: "'Phoflix' <phohoccode@gmail.com>",
          subject: 'Xác nhận đăng ký tài khoản Phoflix',
          template: 'register',
          context: {
            username,
            link: `http://localhost:8000/auth/verify-token?action=register&token=${token}`,
            // link: `${this.clientUrl}/auth/verify-token?action=register&token=${token}`,
          },
        })
        .then(() => {
          console.log('>>> Email sent successfully');
        })
        .catch((error) => {
          console.error('>>> Error sending email:', error);
        });
    }

    const newUser: IUser = await this.usersService.createUser({
      user_id: userId,
      status: user.type_account === 'credentials' ? 'pending' : 'active',
      ...user,
    });

    return {
      status: true,
      message:
        user.type_account === 'credentials'
          ? 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.'
          : 'Đăng ký thành công!',
      result: {
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
        },
        token,
      },
    };
  }

  async completeRegistration(token: string) {
    try {
      const data = this.jwtStrategy.decryptData(token);

      console.log('>>> check data completeRegistration', data);

      if (!data) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      const user = await this.usersService.updateStatusUser(
        data?.user_id,
        'active',
      );

      return {
        status: true,
        message: 'Kích hoạt tài khoản thành công!',
        result: {
          user,
        },
      };
    } catch (error) {
      console.log('>>> check error completeRegistration', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể hoàn tất đăng ký');
    }
  }
}
