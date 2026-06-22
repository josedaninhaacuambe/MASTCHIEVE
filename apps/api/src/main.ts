import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as compression from 'compression';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4301);
  const prefix = configService.get<string>('API_PREFIX', 'api');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:4300');

  // Security
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(compression());

  // CORS — inclui localhost:3000 para proxy Next.js e variantes de dev
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:4300',
      'http://localhost:4390',
      'http://localhost:19006',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  app.setGlobalPrefix(prefix);

  // Versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mastchieve IA API')
      .setDescription('Sistema de Gestão de Desempenho de Atletas com IA')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação')
      .addTag('students', 'Gestão de Atletas')
      .addTag('instructors', 'Gestão de Instrutores')
      .addTag('classes', 'Gestão de Turmas')
      .addTag('attendance', 'Presenças')
      .addTag('feedback', 'Feedback IA')
      .addTag('financial', 'Módulo Financeiro')
      .addTag('kpi', 'KPIs e Analytics')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 Mastchieve API running on: http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
