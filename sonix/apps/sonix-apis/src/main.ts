/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {Logger, ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import helmet from 'helmet';
import {AppModule} from './app.module';
import {ProblemDetailsFilter} from './common/filters/problem-details.filter';
import {PaginationInterceptor} from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the SPA frontend.
  // In production set CORS_ORIGIN to a comma-separated list of allowed origins,
  // e.g. CORS_ORIGIN=https://app.yourcompany.com
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:3004',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Security headers — scoped to the API server only (SPA has its own CSP meta tag).
  // frame-ancestors is enforced here via HTTP header (meta tag cannot enforce it).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger UI requires inline scripts and styles
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          // Swagger UI loads spec icons / external images
          imgSrc: ["'self'", 'data:', 'https:'],
          // API only communicates with itself
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: {policy: 'strict-origin-when-cross-origin'},
    }),
  );

  // Apply global pagination interceptor to enforce query limits
  app.useGlobalInterceptors(new PaginationInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(app.get(ProblemDetailsFilter));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('DMS Sonix API')
    .setDescription('API documentation for DMS Sonix Dealership Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('location', 'Location management endpoints')
    .addTag('vendors', 'Vendor management endpoints')
    .addTag('parts', 'Parts management endpoints')
    .addTag('bins', 'Bin management endpoints')
    .addTag('uoms', 'Unit of Measurement endpoints')
    .addTag('user', 'User management and profile endpoints')
    .addTag('tax-codes', 'Tax code reference data endpoints')
    .addTag('sale-categories', 'Sale category reference data endpoints')
    .addTag('group-codes', 'Group code reference data endpoints')
    .addTag('gl-groups', 'GL group reference data endpoints')
    .addTag('ship-weight-codes', 'Shipping weight code reference data endpoints')
    .addTag('part-status-codes', 'Part status code reference data endpoints')
    .addTag('system-health', 'System health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/openapi.json', // Custom JSON endpoint
  });

  const port = process.env.DMS_SONIX_APIS_PORT || 3000;

  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);

  Logger.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);

  Logger.log(`📄 OpenAPI Spec (JSON) available at: http://localhost:${port}/api/openapi.json`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application:', error);
  process.exit(1);
});
