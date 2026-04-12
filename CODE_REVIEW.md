# Backend Boilerplate Code Review

**Reviewer:** Senior Engineer
**Date:** 2026-04-12
**Project:** Node.js + Express + TypeScript + Prisma Boilerplate

---

## Executive Summary

The boilerplate has a solid foundation — layered architecture, Prisma ORM, JWT auth, RBAC, Docker support. However, there are **critical gaps** across security, developer experience, database patterns, testing, and operations. This document enumerates every issue and prescribes a fix.

---

## 1. SECURITY

### 1.1 CRITICAL: No Rate Limiting
**File:** `src/app.ts`
- No rate limiting middleware anywhere. Login/signup endpoints are brute-force targets.
- **Fix:** Install `express-rate-limit`, apply per-route limits ( stricter on auth endpoints).

### 1.2 CRITICAL: Refresh Token Not Revoked on Logout
**File:** [auth.service.ts](src/services/auth.service.ts#L94-L96)
- `logout()` is a no-op. The refresh token remains valid until expiration.
- **Fix:** Implement a token denylist (Redis or DB table `revoked_tokens`). Check denylist on refresh.

### 1.3 HIGH: Refresh Token Not Rotated
**File:** [auth.service.ts](src/services/auth.service.ts#L98-L119)
- `/refresh` endpoint reissues the **same** refresh token instead of rotating it.
- This breaks the refresh token rotation pattern and increases token lifetime risk.
- **Fix:** On every refresh, issue a new refresh token and add the old one to a denylist.

### 1.4 HIGH: Password Regex/Complexity Not Enforced
**File:** [users.dto.ts](src/dtos/users.dto.ts#L8)
- `@IsString()` on password — no length, complexity, or common-password checks.
- **Fix:** Add `@MinLength(8)`, `@MaxLength(128)`, custom validator for common passwords.

### 1.5 HIGH: Cookie Security — SameSite=None Without Secure
**File:** [cookie.service.ts:108](src/services/cookie.service.ts#L108)
- `SameSite=None` requires `Secure=true`. The current logic doesn't enforce this.
- **Fix:** When `sameSite: 'none'` or cross-origin, always set `Secure: true`.

### 1.6 MEDIUM: CSRF Secret Hardcoded
**File:** [csrf.middleware.ts:6](src/middlewares/csrf.middleware.ts#L6)
- `CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-in-production'` — fallback to insecure default.
- **Fix:** Make it required in the config schema (not optional).

### 1.7 MEDIUM: Auth Error Messages Too Revealing
**Files:** [auth.service.ts:63](src/services/auth.service.ts#L63)
- "User with this email already exists" on signup — exposes whether an email is registered.
- **Fix:** Return generic "Email or password invalid" for all auth failures.

### 1.8 MEDIUM: No Request ID for Audit Logging
**Files:** [error.middleware.ts](src/middlewares/error.middleware.ts)
- Error logs don't include a request ID, making it impossible to correlate logs across services.
- **Fix:** Add a request ID middleware (e.g., `uuid.v4()`) to every request, include in logs.

### 1.9 HIGH: Password Returned in API Responses
**Files:** [users.service.ts:6-8](src/services/users.service.ts#L6-L8), [auth.service.ts:85](src/services/auth.service.ts#L85)
- `findAllUser()` and `login()` return full user objects including the `password` field.
- **Fix:** Use Prisma `select` to exclude password in all list/read operations. Never return password in API responses.

### 1.10 LOW: CORS Allowed Headers Not Specified
**File:** [app.ts:107](src/app.ts#L107)
- CORS is configured but `allowedHeaders` and `exposedHeaders` are not set explicitly.
- **Fix:** Explicitly set `allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-Id']` and `exposedHeaders: ['Authorization']`.

---

## 2. ARCHITECTURE & CODE QUALITY

### 2.1 HIGH: No Dependency Injection
**Files:** [auth.controller.ts:8](src/controllers/auth.controller.ts#L8), [users.controller.ts:7](src/controllers/users.controller.ts#L7), [users.route.ts:12](src/routes/users.route.ts#L12)
- Controllers instantiate services with `new`. No DI container.
- This makes testing harder and violates the single-responsibility principle for dependency management.
- **Fix:** Use a lightweight DI container (e.g., `tsyringe`, `typedi`, or even a manual factory pattern) to manage service instantiation. At minimum, create a `Container` class that instantiates and caches singletons.

### 2.2 HIGH: No Repository Layer for Prisma Queries
**Files:** [users.service.ts](src/services/users.service.ts), [auth.service.ts](src/services/auth.service.ts)
- Services directly call `prisma.user.findUnique(...)`. Business logic is mixed with DB access.
- **Fix:** Add a repository layer (`src/repositories/UserRepository.ts`) that handles all Prisma interactions. Services call repositories. This enables easier mocking and cleaner separation.

### 2.3 HIGH: No Pagination on `findAllUser`
**File:** [users.service.ts:6-8](src/services/users.service.ts#L6-L8)
- Returns all users — will crash on large datasets.
- **Fix:** Add `skip`/`take` pagination with `page`/`limit` query params. Return `{ data, total, page, limit }`.

### 2.4 HIGH: No Transaction Support for Multi-Entity Operations
**Files:** [auth.service.ts:60-72](src/services/auth.service.ts#L60-L72)
- Signup creates a user but does nothing with organization associations.
- **Fix:** Wrap signup + user-organization creation in a `prisma.$transaction()`.

### 2.5 MEDIUM: Inconsistent Error Types
**Files:** [auth.service.ts:63](src/services/auth.service.ts#L63), [auth.service.ts:77](src/services/auth.service.ts#L77)
- Some errors use `HttpException` (via `next()`), others use `Object.assign(new Error(), { status: X })`. This is inconsistent and makes error handling fragile.
- **Fix:** Use `HttpException` consistently everywhere. Remove the `Object.assign` pattern entirely.

### 2.6 MEDIUM: No Standardized API Response Format
**Files:** [auth.controller.ts:15](src/controllers/auth.controller.ts#L15), [users.controller.ts](src/controllers/users.controller.ts)
- Responses are `{ data, message }` everywhere, but errors return `{ message }` only.
- **Fix:** Enforce a consistent response shape:
  - Success: `{ data, message, meta? }`
  - Error: `{ error: { code, message, details? } }`

### 2.7 MEDIUM: ULID Branded Type Not Used in Services/Controllers
**Files:** [users.service.ts:11](src/services/users.service.ts#L11), [users.controller.ts:21](src/controllers/users.controller.ts#L21)
- `userId` is typed as `string` in service methods, not `ULID`. The `ULID` branded type in `interfaces/users.interface.ts` is defined but never used as a type.
- **Fix:** Use `ULID` type from interface in all service/controller methods. Validate incoming IDs with `assertULID()`.

### 2.8 MEDIUM: Auth Controller Creates AuthService Instance Per Request
**File:** [auth.controller.ts:8](src/controllers/auth.controller.ts#L8)
- `public authService = new AuthService()` — new instance per controller instantiation.
- **Fix:** Use a singleton or DI container. The service has no state, so this is wasteful.

### 2.9 LOW: `isEmpty` Utility Never Used
**File:** [util.ts:7](src/utils/util.ts#L7)
- The `isEmpty` function is defined but never imported anywhere in the codebase.
- **Fix:** Remove or document its intended use case.

---

## 3. DATABASE & PRISMA

### 3.1 HIGH: No Prisma Logging in Development
**File:** [prisma.ts](src/databases/prisma.ts)
- Prisma client is created without any logging configuration. Query performance issues are invisible.
- **Fix:** Add `log: ['query', 'info', 'warn', 'error']` in dev mode.

### 3.2 HIGH: No Database Connection Pool Config
**File:** [prisma.ts:18](src/databases/prisma.ts#L18)
- `new Pool({ connectionString })` — no pool size, no timeout configuration.
- **Fix:** Configure pool: `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`.

### 3.3 HIGH: No DB Connection Retry Logic
**File:** [app.ts:49-57](src/app.ts#L49-L57)
- `connectToDatabase` fails once and exits — no retry with backoff.
- **Fix:** Implement retry logic (3 attempts, exponential backoff) for database connection.

### 3.4 MEDIUM: Prisma Client Not Disconnected in Tests
**File:** [auth.test.ts](src/tests/auth.test.ts)
- Tests create App instances but don't explicitly disconnect Prisma between tests.
- **Fix:** Add `afterAll` hook that calls `prisma.$disconnect()`.

### 3.5 MEDIUM: No Soft Deletes
**Files:** [user.prisma](prisma/models/user.prisma)
- User deletion is hard delete. No audit trail for deleted users.
- **Fix:** Add `deletedAt DateTime?` field and filter queries to exclude soft-deleted users.

### 3.6 MEDIUM: Organization Model Missing `name` Length Validation
**File:** [organization.prisma](prisma/models/organization.prisma)
- `name String` with no length constraints.
- **Fix:** `@db.VarChar(255)` with a min-length validator.

### 3.7 LOW: No Database Seeding Script
- No `prisma/seed.ts` or `scripts/seed.ts` for test/dev data.
- **Fix:** Add a seed script and `prisma.seed` npm script.

---

## 4. VALIDATION & INPUT HANDLING

### 4.1 HIGH: No ID Validation Before Prisma Query
**Files:** [users.controller.ts:21](src/controllers/users.controller.ts#L21), [users.controller.ts:43](src/controllers/users.controller.ts#L43)
- `req.params.id` is passed directly to `findUserById` without ULID validation. Invalid ULIDs will cause Prisma errors (or UUID mismatches since the DB field is `@db.Uuid`).
- **Fix:** Use the `@IsUlid()` decorator or `assertULID()` in validation middleware for route params.

### 4.2 MEDIUM: No Pagination Query Param Validation
**Files:** [users.controller.ts:9](src/controllers/users.controller.ts#L9)
- `page` and `limit` query params accepted without validation — negative or NaN values will crash or behave unexpectedly.
- **Fix:** Add validation middleware for `page` (min: 1) and `limit` (min: 1, max: 100).

### 4.3 MEDIUM: Race Condition on Email Uniqueness
**File:** [auth.service.ts:61](src/services/auth.service.ts#L61)
- Checks `findUnique` before create, but race conditions mean two simultaneous requests can both pass the check and one will fail with a DB constraint error (not handled gracefully).
- **Fix:** Wrap in transaction + catch Prisma's `P2002` unique constraint error and convert to `HttpException(409, ...)`.

### 4.4 LOW: No Request Body Size Limit
**File:** [app.ts:111](src/app.ts#L111)
- `express.json()` has no `limit` option — accepts arbitrarily large payloads.
- **Fix:** Add `express.json({ limit: '10kb' })`.

---

## 5. TESTING

### 5.1 HIGH: No Meaningful Test Coverage
**Files:** [auth.test.ts](src/tests/auth.test.ts), [users.test.ts](src/tests/users.test.ts)
- All test files are minimal smoke tests with zero real assertions. Tests pass without actually verifying behavior.
- **Fix:** Write integration tests for all endpoints, unit tests for service logic with mocked Prisma.

### 5.2 HIGH: Tests Hit Real Database
**File:** [auth.test.ts](src/tests/auth.test.ts)
- Tests create users in the actual database — tests are not isolated and will fail in CI without a test DB.
- **Fix:** Use a separate test database (PostgreSQL container in Docker Compose with a `test` service). Or mock Prisma with `jest-prisma` or a custom mock layer.

### 5.3 HIGH: No Mocking Strategy
- No mock for Prisma, no mock for external services (S3, SMTP).
- **Fix:** Create a `src/tests/__mocks__/` directory with Prisma mock. Use `jest.mock()` for storage and mail.

### 5.4 MEDIUM: Test Timeout Too Generous
**File:** [auth.test.ts:7](src/tests/auth.test.ts#L7)
- `jest.setTimeout(10000)` is too generous and masks slow tests.
- **Fix:** Set per-test timeout to 5000ms and use `beforeAll` for DB setup with a timeout.

### 5.5 MEDIUM: No Test Environment Variables
- No `.env.test` or test-specific config. Tests rely on the same `.env` as dev.
- **Fix:** Create `.env.test` with `NODE_ENV=test` and a separate test DB URL.

### 5.6 LOW: No Test Directory Organization
- All tests flat in `src/tests/`. No separation between unit, integration, e2e.
- **Fix:** Organize as `src/tests/unit/`, `src/tests/integration/`, `src/tests/e2e/` (if adding e2e later).

---

## 6. DEVELOPER EXPERIENCE

### 6.1 HIGH: No Health Check Endpoints
- No `/health`, `/health/live`, `/health/ready` endpoints for orchestration (Kubernetes, load balancers).
- **Fix:** Add a health controller with:
  - `/health/live` → returns 200 if process is alive
  - `/health/ready` → returns 200 if DB + storage + mail are connected

### 6.2 HIGH: No Database Migration in Docker Startup
**Files:** [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml)
- No `prisma migrate deploy` or `prisma db push` in the startup script. DB schema must be applied manually or migrations won't run inside the container.
- **Fix:** Add `prisma migrate deploy` to the startup script / Dockerfile, or document that migrations must be run before starting.

### 6.3 HIGH: No Hot Reload Verification in Docker
**File:** [Dockerfile](Dockerfile#L17)
- Dev stage runs `npm run dev` but the volume mount setup in docker-compose is not verified. nodemon may not pick up changes reliably in all environments.
- **Fix:** Ensure `docker-compose.yml` mounts source as volumes and nodemon config is correct. Add a `docker-compose.dev.yml` with proper configuration.

### 6.4 MEDIUM: Poor Error Responses — No Error Codes
**Files:** [error.middleware.ts:11](src/middlewares/error.middleware.ts#L11)
- Error responses are `{ message: "..." }` — no error code, no request ID, no stack trace in dev.
- **Fix:** In development, include `requestId`, `stack`, and an `errorCode`. In production, only return `message` + `requestId`.

### 6.5 MEDIUM: No CI Pipeline
- No CI config. Pre-commit hooks exist but there's no automated check on push.
- **Fix:** Add `.github/workflows/ci.yml` that runs `npm run lint`, `npm run test`, `npm run build`.

### 6.6 MEDIUM: No Migration Scripts in package.json
- Migrations must be run manually with `npx prisma migrate`.
- **Fix:** Add `db:migrate`, `db:push`, `db:seed` scripts to package.json.

### 6.7 MEDIUM: PM2 Config Not Used in Production
**Files:** [ecosystem.config.js](ecosystem.config.js)
- PM2 ecosystem is configured but there's no `pm2-runtime` or `pm2 start` in the Docker production CMD.
- **Fix:** Use PM2 in production Docker CMD: `pm2-runtime start ecosystem.config.js --env production`.

### 6.8 LOW: Inconsistent Path Alias Usage
**Files:** [auth.service.ts:6](src/services/auth.service.ts#L6), [auth.service.ts:7](src/services/auth.service.ts#L7)
- `auth.service.ts` uses `@/config` (relative) while others use `@config`. This inconsistency will confuse juniors.
- **Fix:** Standardize on `@config` everywhere. Add an ESLint rule to enforce alias usage over relative imports.

### 6.9 LOW: No `.env.local` Documentation
- `.env.example` exists but there's no guidance on how to use `.env.local`, `.env.development.local`, etc.
- **Fix:** Add a "Environment Setup" section in README explaining the dotenv loading cascade.

### 6.10 LOW: No Docker Health Check
**Files:** [docker-compose.yml](docker-compose.yml)
- Container has no `healthcheck` defined.
- **Fix:** Add `healthcheck: { test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health/live"], interval: 30s, timeout: 10s, retries: 3 }`.

---

## 7. CONFIGURATION & OPERATIONS

### 7.1 HIGH: Server Instance Not Stored for Graceful Shutdown
**File:** [app.ts:40-47](src/app.ts#L40-L47)
- `app.listen()` is called but the returned server instance is not stored. This makes graceful shutdown impossible — the server can't be stopped gracefully.
- **Fix:** Store `this.server = this.app.listen(...)`, and in `shutdown()`, call `this.server.close()` before disconnecting Prisma.

### 7.2 HIGH: Async Constructor Not Awaited
**Files:** [app.ts:49-57](src/app.ts#L49-L57)
- `connectToDatabase()`, `connectToStorage()`, `connectToMail()` are called in the constructor but are async. The constructor doesn't await them — errors in DB connection won't block app startup.
- **Fix:** Make the constructor or a separate `start()` method async and await all connections before calling `listen()`.

### 7.3 MEDIUM: Log Level Not Configurable
**File:** [logger.ts](src/utils/logger.ts)
- Logger is hardcoded to `debug` and `error` transports with no environment-based log level override.
- **Fix:** Add `LOG_LEVEL` env var (default `info`) and configure logger's level accordingly.

### 7.4 MEDIUM: No Structured Request Logging
**File:** [app.ts](src/app.ts)
- Morgan logs requests but there's no structured request/response logging with timing, headers (sanitized), and body size.
- **Fix:** Add a custom logging middleware that logs: `method`, `path`, `status`, `responseTime`, `ip`, `userId` (if authenticated).

### 7.5 MEDIUM: S3 Bucket Not Validated at Startup
**File:** [storage.ts:8-11](src/databases/storage.ts#L8-L11)
- If `S3_BUCKET` is empty, `createS3Client()` returns `null` silently. The app starts but storage features silently fail.
- **Fix:** If storage is configured (S3_BUCKET is set), throw if client creation fails at startup.

### 7.6 LOW: Graceful Shutdown Kills In-Flight Requests
**File:** [app.ts:77-91](src/app.ts#L77-L91)
- `shutdown()` calls `process.exit(0)` immediately after DB disconnect — in-flight requests are killed.
- **Fix:** Add a 30-second grace period: stop accepting new requests, wait for in-flight to complete, then disconnect.

---

## 8. DOCKER & INFRASTRUCTURE

### 8.1 HIGH: Outdated Node Version (14)
**File:** [Dockerfile:2](Dockerfile#L2)
- Base image is `node:14.14.0-alpine3.12` — Node 14 is EOL. This also pulls an old Alpine 3.12 with potential CVEs.
- **Fix:** Use `node:22-alpine` or `node:20-alpine`. Update all corresponding package.json engines field.

### 8.2 HIGH: No Multi-Stage Build for Production
**File:** [Dockerfile](Dockerfile)
- The Dockerfile does `npm install` from scratch. Production build should copy `package.json` + `package-lock.json`, run `npm ci`, then copy source.
- **Fix:** Use Docker layer caching: copy lockfile, `npm ci`, then copy source and `npm run build`.

### 8.3 HIGH: No PostgreSQL in Docker Compose
**File:** [docker-compose.yml](docker-compose.yml)
- Docker compose only defines the server service. There's no `db` service for local development.
- **Fix:** Add a `postgres:16-alpine` service with proper credentials, health check, and volume.

### 8.4 MEDIUM: Dockerfile Doesn't Exclude Test Files
**File:** [.dockerignore](.dockerignore)
- Review the `.dockerignore` to ensure `node_modules`, `.git`, `src/logs`, `*.test.ts` are all excluded.
- **Fix:** Audit `.dockerignore` — confirm it excludes everything unnecessary and verify build context size.

### 8.5 LOW: No Non-Root User in Dockerfile
**File:** [Dockerfile](Dockerfile)
- Container runs as root. Best practice is to create and switch to a non-root user.
- **Fix:** Add `RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001` and `USER nodejs` before the CMD.

---

## 9. DOCUMENTATION

### 9.1 HIGH: No API Documentation for Auth Endpoints
**File:** [swagger.yaml](swagger.yaml)
- Swagger docs exist for users but not for auth (signup, login, refresh, logout). This is the most critical API surface.
- **Fix:** Add OpenAPI specs for all auth endpoints with request/response schemas, error codes, and example values.

### 9.2 MEDIUM: No Architecture Decision Record (ADR)
- No document explaining why ULID was chosen over UUID, why Prisma was chosen, why SWC for build, etc.
- **Fix:** Add `docs/adr/` directory with ADRs for key decisions.

### 9.3 MEDIUM: README Doesn't Explain Migrations
**Files:** [README.md](README.md)
- New developers don't know they need to run `npx prisma migrate dev` before starting.
- **Fix:** Add a "First-Time Setup" section in README with migration and seeding steps.

---

## Priority Fix List

| Priority | Issue | Category |
|----------|-------|----------|
| CRITICAL | Add rate limiting | Security |
| CRITICAL | Refresh token denylist on logout | Security |
| CRITICAL | Exclude password from all API responses | Security |
| HIGH | Fix refresh token rotation | Security |
| HIGH | Add password complexity validation | Security |
| HIGH | Add health check endpoints (`/health/live`, `/health/ready`) | DevOps |
| HIGH | Fix graceful shutdown (store server ref, graceful http close) | Reliability |
| HIGH | Add DB connection retry with backoff | Reliability |
| HIGH | Add request ID to all logs | Operations |
| HIGH | Add pagination to `findAllUser` | Performance |
| HIGH | Add CI pipeline (.github/workflows/ci.yml) | DX |
| HIGH | Add DB to docker-compose | DX |
| HIGH | Update Dockerfile Node version to 22-alpine | Security |
| HIGH | Add ULID param validation on all ID routes | Security |
| HIGH | Add repository layer | Architecture |
| HIGH | Add DI container | Architecture |
| HIGH | Add Prisma logging in dev | Database |
| HIGH | Configure DB connection pool | Database |
| HIGH | Write real tests (not stubs) | Testing |
| HIGH | Mock Prisma in tests | Testing |
| MEDIUM | Standardize error responses with error codes | DX |
| MEDIUM | Standardize on `HttpException` everywhere | Code Quality |
| MEDIUM | Add `db:migrate`, `db:push`, `db:seed` npm scripts | DX |
| MEDIUM | Use PM2 in Docker production CMD | DevOps |
| MEDIUM | Add LOG_LEVEL env var to logger | Operations |
| MEDIUM | Add S3 validation at startup | Operations |
| MEDIUM | Handle Prisma P2002 in signup | Validation |
| MEDIUM | Make CSRF_SECRET required in config | Security |
| MEDIUM | Generic auth error messages on signup | Security |
| MEDIUM | Add pagination query param validation | Validation |
| MEDIUM | Standardize path aliases (@config everywhere) | DX |
| MEDIUM | Add soft deletes to User model | Database |
| MEDIUM | Add request body size limit | Security |
| LOW | Use PM2 ecosystem.config.js in prod | DevOps |
| LOW | Remove unused `isEmpty` utility | Code Quality |
| LOW | Document .env.local cascade in README | DX |
| LOW | Add Docker health check | DevOps |
| LOW | Add non-root user to Dockerfile | Security |
| LOW | Add .env.test with test DB URL | Testing |
| LOW | Organize tests into unit/integration directories | Testing |
| LOW | Add ADR docs for key decisions | Documentation |
| LOW | Audit .dockerignore | Infrastructure |
| LOW | Add grace period before shutdown | Operations |

---

*End of review.*