export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

  // Warn if using default secret in production
  if (nodeEnv === 'production' && jwtSecret === 'dev-secret-change-in-production') {
    console.warn(
      '⚠️  WARNING: Using default JWT_SECRET in production! Please set a secure JWT_SECRET in your environment variables.',
    );
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'console',
      resendApiKey: process.env.RESEND_API_KEY,
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      sesAccessKeyId: process.env.SES_ACCESS_KEY_ID,
      sesSecretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
      sesRegion: process.env.SES_REGION || 'us-east-1',
      from: process.env.EMAIL_FROM || 'noreply@oneflow.com',
    },
    passwordReset: {
      tokenExpiry: process.env.PASSWORD_RESET_TOKEN_EXPIRY || '3600',
    },
    frontend: {
      url: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
    ai: {
      provider: process.env.AI_PROVIDER || 'console',
      openaiApiKey: process.env.OPENAI_API_KEY,
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    },
    invoice: {
      dueDays: parseInt(process.env.INVOICE_DUE_DAYS || '30', 10),
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      defaultPlatformFeeRate: parseFloat(
        process.env.STRIPE_DEFAULT_PLATFORM_FEE_RATE || '10',
      ),
    },
    payment: {
      defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe',
    },
    notifications: {
      overdueReminderSchedule:
        process.env.OVERDUE_REMINDER_SCHEDULE || '0 9 * * *', // Daily at 9 AM
      defaultOverdueReminderDays: [7], // Default reminder schedule
    },
  };
};

