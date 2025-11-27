
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { requestLogger } from './common/request-logger.middleware';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const loggerLevels: LogLevel[] = process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['verbose', 'debug', 'error', 'warn', 'log'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: loggerLevels });
  const logger = new Logger('HTTP');

  app.use(requestLogger(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));

  const config = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription('Todo service API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
