import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT') || 8080;
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    '*',
  ];
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';

  // config prefix api
  app.setGlobalPrefix(`api/${apiVersion}`, {
    exclude: [
      '',
      '/healthz',
      {
        path: '/crawl/*path',
        method: RequestMethod.ALL,
      },
    ],
  });

  // config cors
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // config validation pipe
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
