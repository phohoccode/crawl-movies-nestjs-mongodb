import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT') || 8080;

  // config prefix api
  app.setGlobalPrefix('api/v1', {
    exclude: [
      '',
      {
        path: '/crawl/(.*)',
        method: RequestMethod.ALL,
      },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại bỏ các thuộc tính không được định nghĩa trong DTO
      transform: true, // tự động chuyển đổi kiểu dữ liệu
      transformOptions: {
        enableImplicitConversion: true, // chuyển đổi kiểu dữ liệu tự động
      },
    }),
  );

  await app.listen(port);
}
bootstrap();
