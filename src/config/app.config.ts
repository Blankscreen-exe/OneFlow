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
  };
};

