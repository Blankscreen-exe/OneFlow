import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
const hbs = require('hbs');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const corsOrigin = configService.get<string>('cors.origin') || 'http://localhost:3000';

  // Security - relaxed CSP for admin panel to allow external scripts
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "data:", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  }));

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Raw body parsing for Stripe webhooks
  app.use('/api/payments/webhooks/stripe', json({ verify: (req: any, res, buf) => {
    if (Buffer.isBuffer(buf)) {
      req.rawBody = buf;
    }
    return true;
  }}));

  // View engine configuration (Handlebars)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  
  // Get Handlebars instance from hbs module for helpers
  const handlebars = hbs.handlebars || require('handlebars');
  
  // Configure Handlebars partials - use hbs module directly
  // Register admin partials - they will be available as {{> sidebar}} and {{> header}}
  const adminPartialsPath = join(__dirname, '..', 'views', 'admin', 'partials');
  hbs.registerPartials(adminPartialsPath, (err: any) => {
    if (err) {
      console.error('Error registering admin partials:', err);
    }
  });
  
  // Register general partials if directory exists
  const generalPartialsPath = join(__dirname, '..', 'views', 'partials');
  try {
    const fs = require('fs');
    if (fs.existsSync(generalPartialsPath)) {
      hbs.registerPartials(generalPartialsPath, (err: any) => {
        if (err) {
          console.error('Error registering general partials:', err);
        }
      });
    }
  } catch (error) {
    // Ignore if directory doesn't exist
  }
  
  // Register custom Handlebars helpers - use Handlebars instance
  handlebars.registerHelper('eq', (a: any, b: any) => a === b);
  handlebars.registerHelper('formatDate', (date: Date | string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  });
  handlebars.registerHelper('formatCurrency', (amount: number) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  });
  handlebars.registerHelper('ifEquals', function (arg1: any, arg2: any, options: any) {
    if (arg1 === arg2) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });
  handlebars.registerHelper('substr', (str: any, start: number, length?: number) => {
    if (!str || typeof str !== 'string') return '';
    if (length) return str.substring(start, start + length);
    return str.substring(start);
  });
  
  // Static assets
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // API prefix (exclude admin routes)
  // List specific admin routes to exclude
  app.setGlobalPrefix('api', {
    exclude: ['admin', 'admin/login', 'admin/logout', 'admin/dashboard', 'admin/403', 'admin/404'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('OneFlow API')
    .setDescription('Client-to-Cash MVP API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();

