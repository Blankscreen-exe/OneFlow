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
  };
};

