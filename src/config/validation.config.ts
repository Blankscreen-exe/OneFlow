import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().optional().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  // Email configuration
  EMAIL_PROVIDER: Joi.string()
    .valid('resend', 'sendgrid', 'ses', 'console')
    .default('console'),
  RESEND_API_KEY: Joi.string().optional().allow(''),
  SENDGRID_API_KEY: Joi.string().optional().allow(''),
  SES_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  SES_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  SES_REGION: Joi.string().optional().default('us-east-1'),
  EMAIL_FROM: Joi.string().optional().default('noreply@oneflow.com'),
  // Password reset configuration
  PASSWORD_RESET_TOKEN_EXPIRY: Joi.number().default(3600), // seconds
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
});

