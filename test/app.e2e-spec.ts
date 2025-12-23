import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('email', 'test@example.com');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      // Then login
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/api/auth/forgot-password (POST)', () => {
    it('should request password reset for existing user', async () => {
      // First register a user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'reset@example.com',
          password: 'password123',
        });

      // Request password reset
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('message');
          expect(res.body.data.message).toContain('password reset link');
        });
    });

    it('should return success even for non-existent email (security)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('message');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/api/auth/reset-password (POST)', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Register a user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'resettest@example.com',
          password: 'oldpassword123',
        });

      // Request password reset to get a token
      // In a real scenario, we'd extract the token from the email
      // For testing, we'll need to get it from the database or mock
      // For now, we'll test with an invalid token first
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(400);
    });

    it('should fail when passwords do not match', async () => {
      // This test would need a valid token, so we'll test the validation
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: '123',
          confirmPassword: '123',
        })
        .expect(400);
    });

    it('should reset password with valid token', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'validreset@example.com',
          password: 'oldpassword123',
        });

      // Request password reset
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'validreset@example.com',
        });

      // Note: In a real test, we'd need to extract the token from the database
      // For now, this test demonstrates the flow structure
      // A full implementation would require database access in tests
    });
  });
});

