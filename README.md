# OneFlow - NestJS Boilerplate

A production-ready NestJS boilerplate with automatic database selection: PostgreSQL/MySQL via `DATABASE_URL` when provided, SQLite as fallback for development.

## Features

- ✅ **Smart Database Selection**: Automatically uses SQLite when `DATABASE_URL` is not set
- ✅ **Type Safety**: Full TypeScript with strict mode
- ✅ **Validation**: Request validation with class-validator
- ✅ **Security**: JWT authentication, password hashing, CORS configuration, Helmet
- ✅ **Error Handling**: Global exception filters
- ✅ **Logging**: Structured logging with interceptors
- ✅ **Testing**: Jest configuration with unit and E2E test examples
- ✅ **Documentation**: Swagger/OpenAPI integration
- ✅ **Docker Support**: Multi-stage Dockerfile and docker-compose.yml
- ✅ **Development Experience**: Hot reload, environment validation

## Prerequisites

- Node.js 20+ 
- npm or yarn
- (Optional) Docker and Docker Compose for containerized deployment

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and set your JWT_SECRET
# DATABASE_URL is optional - SQLite will be used if not provided
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Application port |
| `NODE_ENV` | No | `development` | Environment (development/production/test) |
| `DATABASE_URL` | No | - | Database connection string (PostgreSQL/MySQL). If not provided, SQLite is used |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration time |
| `CORS_ORIGIN` | No | `http://localhost:3000` | CORS allowed origin |

### Database URL Examples

**PostgreSQL:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**MySQL:**
```
DATABASE_URL=mysql://user:password@localhost:3306/dbname
```

**SQLite (default):**
```
# Leave DATABASE_URL unset or empty
# Database file will be created at ./database.sqlite
```

## Running the Application

### Development

```bash
# Start development server with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug
```

The application will be available at `http://localhost:3000`

### Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Once the application is running, access Swagger documentation at:

```
http://localhost:3000/api
```

## Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

**Note:** In development mode, TypeORM will automatically synchronize the database schema. In production, always use migrations.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Docker

### Using Docker Compose

```bash
# Start with SQLite (default)
docker-compose up

# Start with PostgreSQL
docker-compose --profile postgres up
```

### Using Dockerfile

```bash
# Build image
docker build -t oneflow .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/database.sqlite:/app/database.sqlite \
  oneflow
```

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── config/                    # Configuration files
│   ├── database.config.ts     # Database configuration with SQLite fallback
│   ├── validation.config.ts   # Environment validation schema
│   └── app.config.ts          # Application configuration
├── database/                  # Database module and migrations
├── common/                    # Shared utilities
│   ├── decorators/            # Custom decorators (@Public, @CurrentUser)
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards
│   └── interceptors/          # Interceptors (logging, transform)
├── auth/                      # Authentication module
├── users/                     # Users module
└── health/                    # Health check module
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users (Protected)

- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin)

### Health

- `GET /api/health` - Health check endpoint

## Security Best Practices

- ✅ Environment variable validation
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token expiration
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation and sanitization
- ✅ Global exception handling

## Development Workflow

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start development server: `npm run start:dev`
5. Access Swagger docs at `http://localhost:3000/api`
6. Run tests: `npm run test`

## License

UNLICENSED

