/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './passport/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersController } from '@/modules/users/users.controller';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
    }),
  ],

  providers: [AuthService, JwtStrategy],
  controllers: [UsersController, AuthController],
  exports: [AuthService],
})
export class AuthModule {}
