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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MoviesModule,
    CrawlModule,
    AuthModule,

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
