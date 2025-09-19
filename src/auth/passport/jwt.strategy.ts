import { JwtService } from '@nestjs/jwt';
/* eslint-disable @typescript-eslint/require-await */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly secret: string = 'phohoccode';

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // không bỏ qua thời gian hết hạn
      secretOrKey: configService.get<string>('JWT_SECRET') || 'phohoccode',
      algorithms: ['HS256'], // cấu hình thuật toán HS256
    });

    this.secret = this.configService.get<string>('JWT_SECRET') || 'phohoccode';
  }

  async validate(payload: { userId: string; role: 'admin' | 'member' }) {
    return { userId: payload.userId, username: payload.role };
  }

  encryptData(
    data: Record<string, any>,
    expiresInSeconds: number = 60 * 3, // mặc định 3 phút
  ): string {
    try {
      return this.jwtService.sign(data, {
        secret: this.secret,
        expiresIn: expiresInSeconds,
        algorithm: 'HS256',
      });
    } catch (error) {
      console.error('>>> Error encrypting data:', error);
      throw new InternalServerErrorException('Lỗi khi mã hóa dữ liệu');
    }
  }

  decryptData(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: this.secret,
        algorithms: ['HS256'],
      });
    } catch (error) {
      console.error('>>> Error decrypting token:', error);
      return null;
    }
  }
}
