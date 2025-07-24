# Contributing to oss.now

Thank you for your interest in contributing to oss.now! This guide will help you set up your development environment and understand our workflow.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.2.13 or higher
- [Docker](https://www.docker.com/) (for local PostgreSQL and Redis)
- Git

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ossdotnow/ossdotnow.git
   cd ossdotnow
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Make a copy of `.env.example` and replace values with your own.

4. **Start the database services**

   ```bash
   bun docker:up
   ```

5. **Run database migrations**

   ```bash
   bun db:migrate
   ```

6. **Seed the database (optional)**

   ```bash
   bun db:seed
   ```

7. **Start the development server**

   ```bash
   bun dev
   ```

   The application will be available at `http://localhost:3000`

> **Note:** Make sure to not have any other Next.Js runnning or OAuth flows may not work correctly.

## Development Workflow

1. **Look through the available issues/bugs**

   If you have haven't got an issue assigned to you, please look through the list of issues and bugs and drop a comment, someone will assign it to you as soon as possible. Do not start work on it without being assigned.

2. **Create a new branch for your feature or bugfix:**

> Always branch off from the `dev` branch (not `main`).

```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes and commit them with descriptive messages.**

4. **Push your branch and create a pull request.**

## Need Help?

If you have any questions or need help with your contribution, please open reach out on [Discord](heeps://l.oss.now/discord).

Thank you for contributing to oss.now!
