# Contributing to oss.now

Thank you for your interest in contributing to oss.now! This guide will help you set up your development environment and understand our workflow.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.13 or higher)
- [Docker](https://www.docker.com/get-started)
- Git

### Environment Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ossdotnow.git
   cd ossdotnow
   ```

2. Create a `.env` file by copying the example:

   ```bash
   cp .env.example .env
   ```

3. Fill in the environment variables:
   - `DATABASE_URL`: Use `postgresql://postgres:postgres@localhost:5432/ossdotnow_db` for local development
   - `BETTER_AUTH_SECRET`: Generate a random string for local development
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: Create a free tier Redis database at [Upstash](https://upstash.com/), then copy the HTTP URL and token from your database dashboard.
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: Follow the guide at [BetterAuth](https://www.better-auth.com/docs/authentication/github) to create a GitHub OAuth application and get your credentials.
   - `UPLOADTHING_TOKEN`: Create a free App from [UploadThing](https://uploadthing.com/) when needed

### Starting the Development Environment

1. Start the PostgreSQL database using Docker:

   ```bash
   bun docker:up
   ```

2. Install dependencies:

   ```bash
   bun i
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with descriptive messages.

3. Run tests to ensure your changes don't break existing functionality:

   ```bash
   bun test
   ```

4. Push your branch and create a pull request.

## Project Structure

This is a monorepo using Turborepo with the following structure:

- `apps/`
  - `web/` - The main web application
- `packages/`
  - `api/` - API endpoints
  - `auth/` - Authentication logic
  - `db/` - Database schema and utilities
  - `env/` - Environment variable handling
  - `ui/` - Shared UI components
  - And more...

## Database Management

- Generate Prisma client: `bun db:generate`
- Apply migrations: `bun db:migrate`
- Push schema changes: `bun db:push`
- Open Prisma Studio: `bun db:studio`

## Need Help?

If you have any questions or need help with your contribution, please open an issue or reach out to the maintainers.

Thank you for contributing to oss.now!
