/* eslint-disable @typescript-eslint/require-await */
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './passport/public.decorator';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '@/modules/users/users.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    console.log('>>> check login', body);

    return 'Login successful';
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @Public()
  @Get('complete-registration')
  async completeRegistration(@Query('token') token: string) {
    return await this.authService.completeRegistration(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return 'Password reset link sent';
  }

  @Public()
  @Get('verify-token')
  async verifyToken(@Body() body: { token: string }) {
    return 'Token is valid';
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return 'Password has been reset';
  }
}
