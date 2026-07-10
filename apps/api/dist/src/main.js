"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const compression = require("compression");
const helmet_1 = require("helmet");
const path = require("path");
const fs = require("fs");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir))
        fs.mkdirSync(uploadsDir, { recursive: true });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 4301);
    const prefix = configService.get('API_PREFIX', 'api');
    const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:4300');
    app.use((0, helmet_1.default)({ crossOriginEmbedderPolicy: false }));
    app.use(compression());
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
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    await app.listen(port);
    console.log(`🚀 Mastchieve API running on: http://localhost:${port}/${prefix}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map