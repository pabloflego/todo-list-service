# Todo List Service
[![CI](https://img.shields.io/github/actions/workflow/status/pabloflego/todo-list-service/ci.yml?branch=main&label=CI)](https://github.com/pabloflego/todo-list-service/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/pabloflego/todo-list-service/branch/main/graph/badge.svg)](https://codecov.io/gh/pabloflego/todo-list-service)

## Service description and assumptions:
- Simple Todo REST API to create, update description, mark done/undone, fetch one, and list todos (default only NOT_DONE; all=true returns all).
- Fields: id, description, status (NOT_DONE, DONE, PAST_DUE), creation/due timestamps, done timestamp (nullable).
- Business rules: overdue NOT_DONE → automatically becomes PAST_DUE; PAST_DUE items can’t be modified.
- Storage: in-memory SQLite (no external DB needed); chosen over H2 to stay aligned with the Node.js/TypeORM ecosystem—adding H2 would introduce extra setup complexity without benefits here..
- No auth; global exception filter normalizes errors and validation runs on all requests.

## Tech Stack
- Runtime: Node.js (see `.nvmrc` for version)
- Framework: NestJS (HTTP + Swagger)
- Persistence: SQLite (in-memory by default via TypeORM)
- Testing: Vitest (unit + e2e), Supertest
- Docker: Multi-stage build, prod image runs compiled app

## Environment Setup
### Prerequisites:
- Clone this repository: git clone https://github.com/pabloflego/todo-list-service.git
- Node: use the version in `.nvmrc` (`nvm use` or `fnm use`), which matches the Docker image. Install Node via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) if you don't have a manager.
- Package manager: `corepack enable` then `pnpm install` (pnpm version is pinned in `package.json`) or `npm i -g pnpm@10.23.0`.
  - Note: if you get a 'Cannot find matching keyid' error with corepack try updating corepack: `npm i -g corepack@latest` then `pnpm install` again
- Docker: For Production image builds

### Development
```bash
pnpm install
pnpm dev            # watch mode
```
Note: by default the service runs at `http://localhost:3000`

### Testing
```bash
pnpm test:all       # Run unit + e2e (without coverage)
pnpm test:unit      # Unit tests + coverage
pnpm watch:unit     # Unit tests in watch mode (without coverage)
pnpm test:e2e       # E2E tests + coverage
pnpm watch:e2e      # E2E tests in watch mode (without coverage)
pnpm check          # Type Checks
```

### Build Production Image & Deploy Container
```bash
pnpm docker:up      # Builds and Deploys Production container
pnpm docker:down    # Kill and remove the container
pnpm docker:build   # (Re)builds production image
```

### Running Production build locally
```bash
pnpm build          # production build
pnpm start          # runs dist build
```

## Swagger / OpenAPI
- Swagger UI served at `/docs` when the app is running.
- The document is generated from controllers/DTOs (`@nestjs/swagger` + validation decorators).

## Environment
- `PORT` (default: 3000)

## CI
GitHub Actions workflow runs Unit Tests, E2E Tests, TS Type-Check and Builds Production Docker image.
