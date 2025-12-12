import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api');

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('JaSlide API')
        .setDescription('AI-powered presentation generation API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('presentations', 'Presentation management')
        .addTag('slides', 'Slide management')
        .addTag('generation', 'AI generation endpoints')
        .addTag('templates', 'Template management')
        .addTag('assets', 'Asset management')
        .addTag('credits', 'Credit system')
        .addTag('export', 'Export endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 4000;
    await app.listen(port);

    console.log(`🚀 JaSlide API is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
