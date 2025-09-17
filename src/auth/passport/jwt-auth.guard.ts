/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JsonWebTokenError } from '@nestjs/jwt/dist';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // customize the handleRequest method to throw an error or return null
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    const messageDefault =
      'Token đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!';

    console.log('JWT Auth Guard - handleRequest info:', info?.message);
    console.log('JWT Auth Guard - handleRequest err:', err);
    console.log('JWT Auth Guard - handleRequest user:', user);

    // xử lý trường hợp không có token
    if (info instanceof Error && info?.message === 'No auth token') {
      throw new UnauthorizedException({ message: 'Không có token xác thực!' });
    }

    // xử lý trường hợp token không hợp lệ
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        message: info.message || messageDefault,
      });
    }

    // xử lý các lỗi khác
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          message: messageDefault,
        })
      );
    }

    return user;
  }
}
