# CrisisDesk AI - Intelligent Backend API for Emergency & Service Request Triage

## Overview

CrisisDesk AI is a backend-only REST API designed to intelligently process emergency reports and public service complaints. The system accepts citizen reports, analyzes them using AI, prioritizes incidents based on urgency, detects potential duplicate reports, and provides administrative APIs for report management and analytics.

This project focuses entirely on backend engineering, API design, database modeling, AI integration, validation, and documentation. No frontend implementation is required.

---

## Problem Statement

Emergency reports often arrive through unstructured and inconsistent channels such as phone calls, text messages, social media posts, or manually written descriptions. These reports are frequently:

- Unstructured or incomplete
- Written in multiple languages
- Duplicated by different citizens
- Difficult to classify and prioritize

The objective is to build an AI-powered backend system capable of transforming these raw reports into structured, actionable incidents.

---

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Runtime          | Node.js 22                                      |
| Framework        | Express.js 5                                    |
| Language         | TypeScript                                      |
| ORM              | Prisma 7 (multi-file schema)                    |
| Database         | PostgreSQL (Neon DB)                            |
| Driver           | `@prisma/adapter-pg` + `pg`                     |
| AI               | Google Gemini API (classification & summarization) |
| Embeddings       | bge-m3 via `@xenova/transformers`               |
| Similarity       | Cosine Similarity                               |
| Validation       | Zod                                             |
| Auth             | JWT (jsonwebtoken) + bcryptjs; cookie or Bearer |
| CORS / Cookies   | `cors`, `cookie-parser`                         |
| Rate Limiting    | `express-rate-limit` (global + per-route)       |
| Env / DX         | `dotenv`, `tsx`                                 |
| Docs             | `swagger-jsdoc` + `swagger-ui-express`          |
| Testing          | Vitest + Supertest                              |
| Container        | Docker (multi-stage) + docker-compose           |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup, middleware, routes
├── server.ts                 # Server bootstrap
├── config/
│   └── index.ts              # Environment variable config (loads .env via dotenv)
├── lib/
│   ├── embedding.ts          # bge-m3 embedder + cosineSimilarity
│   ├── gemini.ts             # Gemini client + classifyReport()
│   ├── prisma.ts             # Prisma client instance
│   └── swagger.ts            # OpenAPI spec (swagger-jsdoc)
├── middlewares/
│   ├── auth.ts               # JWT auth middleware (role-based)
│   ├── globalErrorHandler.ts # Centralized error handler
│   ├── notFound.ts           # 404 handler
│   ├── rateLimiter.ts        # Global + per-route rate limiters
│   └── validateRequest.ts    # Zod schema validator wrapper
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.interface.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   └── report/
│       ├── report.controller.ts
│       ├── report.interface.ts
│       ├── report.routes.ts
│       ├── report.service.ts
│       └── report.validation.ts
├── utils/
│   ├── ApiError.ts           # Typed API error class
│   ├── catchAsync.ts         # Async error wrapper
│   ├── jwt.ts                # JWT sign/verify helpers
│   └── sendResponse.ts       # Standardized response helper
├── __tests__/
│   ├── setup.ts              # Global test setup (env vars, mock resets)
│   ├── helpers/
│   │   └── auth.helper.ts    # Test JWT helpers
│   ├── integration/
│   │   └── report/
│   │       └── create-report.test.ts
│   └── unit/                 # Unit tests (mirrors src/)
├── prisma.config.ts          # Prisma 7 config (loads dotenv, schema path)
prisma/
├── migrations/               # SQL migrations
└── schema/
    ├── schema.prisma         # Generator & datasource
    ├── enums.prisma          # Role, Language, ReportCategory, UrgencyLevel, ReportStatus
    ├── user.prisma           # User model
    └── report.prisma         # Report model
generated/                    # Prisma generated client (gitignored)
Dockerfile                    # Multi-stage build (node:22-bookworm-slim)
docker-compose.yml            # API service definition
vitest.config.ts              # Vitest setup
tsconfig.json                 # TypeScript compiler config
```

---

## Core Features

### 1. Report Submission

**Endpoint:** `POST /api/reports`

Citizens submit emergency reports. No authentication required for submission.

**Request Body:**

```json
{
  "name": "Rahim",
  "contact": "017xxxxxxxx",
  "location": "Sylhet Bondor Bazar",
  "description": "There is a fire near a shop and people are trapped.",
  "language": "bn"
}
```

**Validation Rules:**

- `description` — required, non-empty string
- `location` — required, non-empty string
- `name` — optional string
- `contact` — optional string
- `language` — optional, must be `bn`, `en`, or `unknown` (defaults to `unknown`)

**Success Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Report submitted successfully",
  "data": {
    "id": "uuid",
    "name": "Rahim",
    "contact": "017xxxxxxxx",
    "location": "Sylhet Bondor Bazar",
    "description": "There is a fire near a shop and people are trapped.",
    "language": "bn",
    "category": "fire",
    "urgency": "critical",
    "summary": "একটি দোকানের কাছে আগুন লেগেছে এবং মানুষ আটকা পড়েছে।",
    "canonicalSummary": "Fire reported near a shop with trapped people in Bondor Bazar, Sylhet.",
    "suggestedAction": "Immediately notify fire service and emergency responders.",
    "confidence": 0.91,
    "possibleDuplicate": false,
    "matchedReportId": null,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. AI Classification & Summarization

After receiving a report, the system calls Gemini AI to analyze the incident and generate structured metadata.

**AI Output Fields:**

| Field              | Type   | Description                                          |
| ------------------ | ------ | ---------------------------------------------------- |
| category           | enum   | Issue type classification                            |
| urgency            | enum   | Priority level                                       |
| summary            | string | Short summary in the report's language (bn/en/auto)  |
| canonicalSummary   | string | Short summary always in English (used for embedding) |
| normalizedLocation | string | Location standardized to clean English format        |
| suggestedAction    | string | Recommended action for responders (English)          |
| confidence         | float  | Confidence score (0–1)                               |

**Language-aware summary behavior:**

- `language: "bn"` → `summary` in Bangla
- `language: "en"` → `summary` in English
- `language: "unknown"` → `summary` in the detected language of the description
- `canonicalSummary` is always English regardless of input language

**Location normalization:**

Gemini normalizes the raw location into a clean English format for consistent embedding:

- "সিলেট বন্দর বাজার" → "Bondor Bazar, Sylhet"
- "sylhet bondor bazar area" → "Bondor Bazar, Sylhet"
- Proper capitalization, removes informal words, translates if needed

**Allowed Categories:** `medical`, `fire`, `accident`, `crime`, `flood`, `utility`, `public_service`, `infrastructure`, `other`

**Allowed Urgency Levels:** `low`, `medium`, `high`, `critical`

**Example AI Output:**

```json
{
  "category": "fire",
  "urgency": "critical",
  "summary": "একটি দোকানের কাছে আগুন লেগেছে এবং মানুষ আটকা পড়েছে।",
  "canonicalSummary": "Fire reported near a shop with trapped people in Bondor Bazar, Sylhet.",
  "normalizedLocation": "Bondor Bazar, Sylhet",
  "suggestedAction": "Immediately notify fire service and emergency responders.",
  "confidence": 0.91
}
```

The AI handles both Bangla and English input descriptions.

---

### 3. Duplicate Report Detection

Detects whether a newly submitted report may describe an already existing incident.

**Approach:** Hybrid strategy using bge-m3 embeddings + cosine similarity + Gemini location normalization

**Embedding Input (standardized for all reports):**

```
Category: fire
Location: Bondor Bazar, Sylhet
Summary: Fire reported near a shop with trapped people
```

All three components are in English regardless of the original report language:

- `category` — from AI classification
- `normalizedLocation` — Gemini-normalized English location
- `canonicalSummary` — always-English summary

This ensures cross-language duplicate detection works (a Bangla report and English report about the same incident produce similar embeddings).

**Detection Logic:**

1. AI classifies the report and returns `canonicalSummary` + `normalizedLocation`
2. Generate embedding from the standardized text above
3. Retrieve candidate reports (same category, last 24 hours, not rejected)
4. Calculate cosine similarity between new and candidate embeddings
5. If similarity > 0.90 → mark as duplicate

**Stored Fields:**

- `possibleDuplicate` — boolean (default: `false`)
- `matchedReportId` — UUID of the matched report or `null`
- `embedding` — Float array storing the bge-m3 vector

**Example duplicate detection result:**

```json
{
  "possibleDuplicate": true,
  "matchedReportId": "report_1023"
}
```

---

### 4. Database Schema

**User Model:**

| Field     | Type     | Notes                |
| --------- | -------- | -------------------- |
| id        | UUID     | Primary key          |
| name      | String   | Required             |
| email     | String   | Unique               |
| password  | String   | Hashed with bcryptjs |
| role      | Role     | `user` or `admin`    |
| createdAt | DateTime | Auto-generated       |
| updatedAt | DateTime | Auto-updated         |

**Report Model:**

| Field             | Type            | Notes                                         |
| ----------------- | --------------- | --------------------------------------------- |
| id                | UUID            | Primary key                                   |
| name              | String?         | Optional reporter name                        |
| contact           | String?         | Optional contact info                         |
| location          | String          | Required                                      |
| description       | String          | Required                                      |
| language          | Language        | Default: `unknown`                            |
| category          | ReportCategory? | AI-generated                                  |
| urgency           | UrgencyLevel?   | AI-generated                                  |
| summary           | String?         | AI-generated (in report's language)           |
| canonicalSummary  | String?         | AI-generated (always English, used for embed) |
| suggestedAction   | String?         | AI-generated                                  |
| confidence        | Float?          | AI confidence score (0–1)                     |
| embedding         | Float[]         | bge-m3 vector for duplicate detection         |
| possibleDuplicate | Boolean         | Default: `false`                              |
| matchedReportId   | String?         | UUID of matched report                        |
| status            | ReportStatus    | Default: `pending`                            |
| createdAt         | DateTime        | Auto-generated                                |
| updatedAt         | DateTime        | Auto-updated                                  |

---

### 5. Report Management APIs

| Method | Endpoint                     | Auth Required | Description                |
| ------ | ---------------------------- | ------------- | -------------------------- |
| POST   | `/api/reports`               | No            | Submit a new report        |
| GET    | `/api/reports`               | Admin         | Retrieve all reports       |
| GET    | `/api/reports/:id`           | Admin         | Retrieve a single report   |
| PATCH  | `/api/reports/:id/status`    | Admin         | Update report status       |
| DELETE | `/api/reports/:id`           | Admin         | Delete a report            |
| GET    | `/api/reports/stats/summary` | Admin         | Retrieve analytics summary |

---

### 6. Report Filtering

The `GET /api/reports` endpoint supports query parameters:

| Parameter | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| category  | string | Filter by category enum value            |
| urgency   | string | Filter by urgency enum value             |
| status    | string | Filter by status enum value              |
| search    | string | Free-text search in description/location |
| startDate | string | ISO date — filter reports created after  |
| endDate   | string | ISO date — filter reports created before |
| page      | number | Page number (default: 1)                 |
| limit     | number | Items per page (default: 10)             |

**Example:**

```http
GET /api/reports?category=fire&urgency=critical&page=1&limit=10
```

---

### 7. Report Status Management

**Endpoint:** `PATCH /api/reports/:id/status`

**Allowed Status Values:** `pending`, `in_review`, `assigned`, `resolved`, `rejected`

**Request Body:**

```json
{
  "status": "assigned"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report status updated successfully",
  "data": { "id": "uuid", "status": "assigned", "updatedAt": "..." }
}
```

---

### 8. Analytics & Summary API

**Endpoint:** `GET /api/reports/stats/summary`

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Analytics summary retrieved successfully",
  "data": {
    "totalReports": 45,
    "pendingReports": 18,
    "criticalReports": 7,
    "resolvedReports": 10,
    "categoryBreakdown": {
      "medical": 0,
      "fire": 5,
      "accident": 4,
      "crime": 2,
      "flood": 3,
      "utility": 12,
      "public_service": 6,
      "infrastructure": 3,
      "other": 2
    },
    "urgencyBreakdown": {
      "low": 9,
      "medium": 18,
      "high": 11,
      "critical": 7
    }
  }
}
```

> Keys in `categoryBreakdown` / `urgencyBreakdown` reflect every value of the `ReportCategory` / `UrgencyLevel` enum; counts are `0` for categories with no reports.

---

### 9. Authentication

| Method | Endpoint                | Auth Required | Description                          |
| ------ | ----------------------- | ------------- | ------------------------------------ |
| POST   | `/api/auth/register`    | No            | Register a new admin/user account    |
| POST   | `/api/auth/login`       | No            | Admin login (returns JWT + cookie)   |

**Register — `POST /api/auth/register`**

```json
{
  "name": "Abul Bashar",
  "email": "admin@crisisdesk.ai",
  "password": "supersecret123",
  "role": "admin"
}
```

**Validation:** `name`, `email`, `password` (min 6 chars), `role` (`user` | `admin`) are required.

**Login — `POST /api/auth/login`**

**Request Body:**

```json
{
  "email": "admin@crisisdesk.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": { "accessToken": "jwt_token_here" }
}
```

The access token is also set as an `httpOnly` cookie. Subsequent requests can pass the token via:

- Cookie: `accessToken`
- Header: `Authorization: Bearer <token>`

Admin-only endpoints require a valid JWT with `role: "admin"`.

---

### 10. Validation (Zod)

All incoming requests are validated using Zod schemas before reaching business logic.

**Report submission validation:**

- `description`: `z.string().min(1, "Description is required")`
- `location`: `z.string().min(1, "Location is required")`
- `name`: `z.string().optional()`
- `contact`: `z.string().optional()`
- `language`: `z.enum(["bn", "en", "unknown"]).default("unknown")`

**Status update validation:**

- `status`: `z.enum(["pending", "in_review", "assigned", "resolved", "rejected"])`

---

### 11. Error Handling

All error responses follow a consistent structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description and location are required."
}
```

**Error Scenarios:**

| Scenario              | Status Code | Example Message                              |
| --------------------- | ----------- | -------------------------------------------- |
| Validation failure    | 400         | "Description and location are required."     |
| Unauthorized          | 401         | "You are not authorized. Please log in."     |
| Forbidden             | 403         | "You don't have permission to access this."  |
| Report not found      | 404         | "Report not found."                          |
| AI processing failure | 500         | "AI classification failed. Please try again."|
| Internal server error | 500         | "Internal Server Error"                      |

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/crisisdesk
PORT=8080
APP_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=1d
GEMINI_API_KEY=your_gemini_api_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **How rate limiting is wired:**
> - `RATE_LIMIT_WINDOW_MS` (default `900000` = 15 min) and `RATE_LIMIT_MAX` (default `100`) configure the **global limiter** applied to every route in `app.ts`.
> - On top of that, `src/middlewares/rateLimiter.ts` defines stricter per-route limiters: `reportSubmitLimiter` (30 / 15 min) on `POST /api/reports`, and `authLimiter` (10 / 15 min) on `POST /api/auth/login`.
> - All limits return `429 Too Many Requests` with `RateLimit-*` standard headers.

---

## API Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Descriptive message",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

The `meta` field is included only for paginated list endpoints.

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:8080/api/docs
```

It documents every public and admin endpoint, request schemas, response codes, and the bearer auth scheme used by admin routes.

---

## Docker

```bash
docker compose up -d --build   # build and start the API container
docker compose logs -f api     # tail logs
docker compose down            # stop and remove
```

The `Dockerfile` is a multi-stage build that compiles TypeScript, generates the Prisma client, and runs the runtime image under `tini` for proper signal handling. `docker-compose.yml` reads `.env` and forwards `PORT`, `DATABASE_URL`, `APP_URL`, `BCRYPT_SALT_ROUNDS`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, and `GEMINI_API_KEY` to the container, then waits for `/api/health` before declaring the service healthy.

---

## Scripts

```bash
npm run dev    # Start development server (tsx watch)
npm run build  # Compile TypeScript to dist/
npm start      # Run the server via tsx (no build step required)
npm test       # Run all tests once (vitest run)
```

---

## Testing

The project uses **Vitest** for unit testing with mocked dependencies.

### Test Folder Structure

Mirrors the `src/` directory for easy navigation:

```
src/
├── __tests__/
│   ├── setup.ts                                 # Global test setup (env vars, mock resets)
│   ├── helpers/
│   │   └── auth.helper.ts                       # Test JWT helpers
│   ├── integration/
│   │   └── report/
│   │       └── create-report.test.ts            # End-to-end POST /api/reports (Supertest)
│   └── unit/
│       ├── lib/
│       │   ├── embedding.test.ts                # cosineSimilarity pure logic
│       │   └── gemini.test.ts                   # classifyReport (mocked Gemini API)
│       ├── middlewares/
│       │   └── auth.test.ts                     # JWT auth middleware
│       ├── modules/
│       │   ├── auth/
│       │   │   └── auth.service.test.ts         # login & register logic
│       │   └── report/
│       │       └── report.service.test.ts       # createReport, duplicate detection
│       └── utils/
│           └── jwt.test.ts                      # createToken & verifyToken
```

### Testing Strategy

**Unit Tests** — test isolated business logic with mocked dependencies (`vi.mock()`):

| File                                    | What to Mock                            | What to Test                                                                         |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/embedding.test.ts`                 | Nothing (pure math)                     | `cosineSimilarity` with known vectors (identical → 1, orthogonal → 0)                |
| `lib/gemini.test.ts`                    | `@google/generative-ai`                 | Valid JSON parsing, invalid response → throws, confidence clamping (0–1)             |
| `modules/auth/auth.service.test.ts`     | `prisma`, `bcryptjs`                    | Admin-only login, duplicate email rejection, password mismatch, successful register  |
| `modules/report/report.service.test.ts` | `prisma`, `lib/gemini`, `lib/embedding` | AI result mapping to DB, duplicate detection above/below threshold, empty candidates |
| `utils/jwt.test.ts`                     | Nothing (uses real jsonwebtoken)        | Token creation with payload, valid verification, expired token rejection             |

### Key Conventions

- **Mocking:** All external services (`Gemini API`, `Prisma`, `@xenova/transformers`) are mocked using `vi.mock()`
- **No database needed:** Unit tests never hit a real database — Prisma calls are fully mocked
- **No network calls:** Gemini and embedding model are mocked — tests run offline and fast
- **Isolation:** Each test file is self-contained with its own mocks — no shared state between files
- **Naming:** Test files use `.test.ts` suffix and live alongside the structure they test

### Running Tests

```bash
npm test   # Run unit + integration tests once (vitest run)
```

---

## Setup & Installation

```bash
git clone https://github.com/AbulBashar38/crisis-desk-backend.git
cd crisis-desk-backend
npm install
cp .env.example .env   # Fill in your environment variables
npx prisma generate
npx prisma db push
npm run dev
```

---

## Bonus Features

- [x] Bangla & English language support (via Gemini multilingual capabilities)
- [x] JWT Authentication for admin APIs (cookie + Bearer)
- [x] Request rate limiting — global limiter on every route, plus per-route limiters on `POST /api/reports` and `POST /api/auth/login`
- [x] Schema validation with Zod
- [x] Swagger/OpenAPI documentation at `/api/docs` and `/api/docs.json`
- [x] Docker support (multi-stage `Dockerfile` + `docker-compose.yml` with healthcheck)
- [x] Unit & Integration testing (Vitest + Supertest)
- [x] Advanced duplicate detection using bge-m3 embeddings and cosine similarity
- [x] Clean modular architecture (config / lib / middlewares / modules / utils)
- [x] Live deployment

---

## Live Deployment

- **Base URL:** https://crisis-desk-backend.onrender.com
- **API Docs (Swagger):** https://crisis-desk-backend.onrender.com/api/docs

---

## Deliverables

- Public GitHub repository
- Live deployed backend
- API documentation
- Architecture diagram
- Architecture explanation video
