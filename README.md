# Todo List Service
[![CI](https://img.shields.io/github/actions/workflow/status/pabloflego/todo-list-service/ci.yml?branch=main&label=CI)](https://github.com/pabloflego/todo-list-service/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/pabloflego/todo-list-service/branch/main/graph/badge.svg)](https://codecov.io/gh/pabloflego/todo-list-service)

Backend service built with NestJS and TypeORM (SQLite) to manage to-do items with automatic past-due handling.

## Tech Stack
- Runtime: Node.js (see `.nvmrc` for version)
- Framework: NestJS (HTTP + Swagger)
- Persistence: SQLite (in-memory by default via TypeORM); chosen over H2 to stay aligned with the Node.js/TypeORM ecosystem—adding H2 would introduce extra setup complexity without benefits here.
- Testing: Vitest (unit + e2e), Supertest
- Docker: Multi-stage build, prod image runs compiled app

## Quick Start
```bash
pnpm install
pnpm test:all       # unit + e2e
pnpm build          # production build
pnpm start          # runs dist build
pnpm dev            # watch mode
pnpm docker:up      # Builds and brings up Production container
pnpm docker:down    # Kill and remove the container
pnpm docker:build   # Build container
```

## Swagger / OpenAPI
- Swagger UI served at `/docs` when the app is running.
- The document is generated from controllers/DTOs (`@nestjs/swagger` + validation decorators).

## Environment
- `PORT` (default: 3000)

## CI
GitHub Actions workflow runs type-check and Docker build.
