# AGENTS.md

## Architecture

Microservices monorepo (Node.js + Fastify + PostgreSQL + React/Vite).

```
Pr-Escalado--gil/
├── backend/                     # npm workspace root
│   ├── shared/                  # Shared lib (pg-client, BaseRepository, DTOs, Swagger)
│   ├── PDAE-API-GATEWAY/        # Gateway :3001 – routes by MS_RUTAS_URL
│   ├── PDAE-MS-CONTRATOS/       # :3002
│   ├── PDAE-MS-USUARIOS/        # :3003
│   ├── PDAE-MS-PLANES/          # :3004
│   ├── PDAE-MS-PRODUCTOS/       # :3005
│   ├── PDAE-MS-SOPORTE/         # :3006
│   ├── PDAE-MS-AUDITORIA/       # :3007
│   ├── PDAE-MS-PAGOS/           # :3008
│   └── database/                # SQL init scripts + stored procedures
├── frontend/                    # React + Vite + TypeScript :5173
└── docker-compose.yml           # Full stack orchestration
```

All backend packages live under `backend/package.json` npm workspaces. The `shared` package is a **file dependency** (`"shared": "file:../shared"`) — it must be compiled before any MS can build.

## Build & Dev Commands

### Backend (run from `backend/`)

```bash
# Install all deps (workspace)
npm install

# Build shared (REQUIRED before building any MS)
npm run build --workspace=shared

# Dev a single MS
cd PDAE-MS-CONTRATOS && npm run dev    # uses ts-node-dev

# Build all MS (typecheck)
npm run build --workspaces --if-present

# Test all MS
npm run test --workspaces --if-present

# Test single MS
cd PDAE-MS-CONTRATOS && npm test       # Jest

# Mock mode (offline, no DB)
npm run mock                            # sets NODE_ENV=mock
```

### Frontend (run from `frontend/`)

```bash
npm install
npm run dev         # Vite dev server, proxies /api to gateway
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run test        # Vitest run
```

### Docker (run from repo root)

```bash
docker compose up --watch     # Full stack with hot-reload
docker compose up -d db       # DB only
docker compose logs -f ms-contratos
```

## Critical: shared Build Order

**Always run `npm run build --workspace=shared` from `backend/` before building or testing any microservice.** The shared lib compiles to `backend/shared/lib/` (CommonJS, ES2020). Without it, MS imports from `shared` will fail.

## Commit Convention

Enforced by Husky + Commitlint. Every commit message **must** include a `PDAE-<number>` ticket:

```
feat: PDAE-123 add contract expiration cron
fix: PDAE-456 correct date validation
```

- Type must be lowercase (conventional commits)
- `subject-case` rule is disabled to allow `PDAE-` uppercase
- Test before committing: `echo "feat: PDAE-123 test" | npx --no commitlint`
- Pre-commit hook runs `npm run lint --if-present` (only if `lint` script exists)

## Microservice Pattern

Each MS follows: `src/server.ts` → `src/app.ts` → routes → services → repositories → `BaseRepository.callProcedure()` → PostgreSQL stored functions (`sp_*`).

- `app.ts`: Fastify setup, plugins (cors, helmet, rate-limit, metrics), route registration under `/api`
- Repositories extend `BaseRepository` from `shared` and call `SELECT * FROM sp_*()` stored procedures
- DB connection: `shared/src/database/pg-client.ts` reads `DATABASE_URL` or individual `DB_*` env vars
- Tests mock `pg` and `../src/database/pg-client` globally in `jest.setup.ts`

## Testing Quirks

- **Backend**: Jest with ts-jest. Tests live in `test/` dirs. DB is mocked globally — no real Postgres needed.
- **Coverage thresholds** (per MS): branches 60%, functions 75%, lines 80%, statements 80%.
- **Frontend**: Vitest with jsdom. Setup file at `src/test/setup.ts`.
- CI runs backend tests after `npm run build --workspace=shared`, then frontend typecheck/lint/test/build.

## Environment

- `env.example` at root is the template. Copy to `.env` at repo root.
- Keycloak auth configured via `VITE_KEYCLOAK_*` (frontend) and `KEYCLOAK_*` (backend) env vars.
- `MS_RUTAS_URL`: comma-separated `name:url` pairs for gateway routing.
- Docker `docker-compose.yml` at root uses the root `.env`; `backend/docker-compose.yml` references `../.env`.

## Gotchas

- `shared` tsconfig uses `commonjs` module; MS tsconfigs also use `CommonJS`. Frontend uses ES modules.
- `docker-compose.yml` exists at **two levels**: root (full stack) and `backend/` (backend-only with `dokploy-network` external network).
- The `prepare` script in `backend/package.json` installs Husky — run `npm install` from `backend/` after cloning.
- Each MS has its own `.env` file in its directory, but the root `.env` is the source of truth loaded by docker-compose.
