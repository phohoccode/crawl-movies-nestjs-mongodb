import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoviesModule } from '@/modules/movies/movies.module';
import { CrawlModule } from './modules/crawl/crawl.module';
import { APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerCustomGuard } from './auth/throttler/throttler-custom.guard';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path/win32';

@Module({
  imports: [
    MoviesModule,
    CrawlModule,
    AuthModule,

    // cấu hình biến môi trường toàn cục
    ConfigModule.forRoot({ isGlobal: true }),

    // kết nối MongoDB với Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // cấu hình nodemailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          ignoreTLS: true,
          secure: true,
          auth: {
            user: configService.get<string>('MAILDEV_INCOMING_USER'),
            pass: configService.get<string>('MAILDEV_INCOMING_PASS'),
          },
        },
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
        preview: false, // không mở tab xem trước email
        template: {
          dir: join(__dirname, '..', '/src/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),

    // cấu hình rate limit toàn ứng dụng
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 20,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // cấu hình rate limit toàn ứng dụng
    {
      provide: APP_GUARD,
      useClass: ThrottlerCustomGuard,
    },

    // Cấu hình bảo mật toàn ứng dụng với JWT
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
