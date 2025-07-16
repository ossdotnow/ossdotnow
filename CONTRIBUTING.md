# Contributing to oss.now

Thank you for your interest in contributing to oss.now! This guide will help you set up your development environment and understand our workflow.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.13 or higher)
- [Docker](https://www.docker.com/get-started)
- Git

### Environment Setup

1. Fork & Clone the repository:
   First, fork the repository on GitHub and then clone it to your local machine:
   ```bash
   git clone https://github.com/yourusername/ossdotnow.git
   cd ossdotnow
   ```

2. Create a `.env` file by copying the example:

   ```bash
   cp .env.example .env
   ```

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

> **Note:** Make sure to not have any other Next.Js runnning or OAuth flows may not work correctly.

## Development Workflow

1. Create a new branch for your feature or bugfix:

> Always branch off from the `dev` branch (not `main`).

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with descriptive messages.

3. Push your branch and create a pull request.

## Need Help?

If you have any questions or need help with your contribution, please open an issue or reach out to the maintainers.

Thank you for contributing to oss.now!
