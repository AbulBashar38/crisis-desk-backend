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
| Runtime          | Node.js                                         |
| Framework        | Express.js 5                                    |
| Language         | TypeScript                                      |
| ORM              | Prisma (multi-file schema)                      |
| Database         | PostgreSQL (Neon DB)                             |
| AI               | Google Gemini API (classification & summarization) |
| Embeddings       | bge-m3 model (multilingual duplicate detection) |
| Similarity       | Cosine Similarity                               |
| Validation       | Zod                                             |
| Authentication   | JWT (access token via cookie or Bearer header)  |
| Documentation    | Swagger / OpenAPI                               |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup, middleware, routes
├── server.ts                 # Server bootstrap
├── config/
│   └── index.ts              # Environment variable config
├── lib/
│   └── prisma.ts             # Prisma client instance
├── middlewares/
│   ├── auth.ts               # JWT auth middleware (role-based)
│   ├── globalErrorHandler.ts # Centralized error handler
│   └── notFound.ts           # 404 handler
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.interface.ts
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   └── report/
│       ├── report.controller.ts
│       ├── report.interface.ts
│       ├── report.routes.ts
│       ├── report.service.ts
│       └── report.validation.ts
├── utils/
│   ├── catchAsync.ts         # Async error wrapper
│   ├── jwt.ts                # JWT sign/verify helpers
│   └── sendResponse.ts       # Standardized response helper
prisma/
└── schema/
    ├── schema.prisma         # Generator & datasource
    ├── enums.prisma          # All enums (Role, Language, ReportCategory, UrgencyLevel, ReportStatus)
    ├── user.prisma           # User model
    └── report.prisma         # Report model
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
    "summary": "A fire has been reported near a shop with possible trapped people.",
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

| Field           | Type   | Description                        |
| --------------- | ------ | ---------------------------------- |
| category        | enum   | Issue type classification          |
| urgency         | enum   | Priority level                     |
| summary         | string | Short AI-generated summary         |
| suggestedAction | string | Recommended action for responders  |
| confidence      | float  | Confidence score (0–1)             |

**Allowed Categories:** `medical`, `fire`, `accident`, `crime`, `flood`, `utility`, `public_service`, `infrastructure`, `other`

**Allowed Urgency Levels:** `low`, `medium`, `high`, `critical`

**Example AI Output:**

```json
{
  "category": "fire",
  "urgency": "critical",
  "summary": "A fire has been reported near a shop with possible trapped people.",
  "suggestedAction": "Immediately notify fire service and emergency responders.",
  "confidence": 0.91
}
```

The AI must handle both Bangla and English input descriptions.

---

### 3. Duplicate Report Detection

Detects whether a newly submitted report may describe an already existing incident.

**Approach:** Hybrid strategy using bge-m3 embeddings + cosine similarity

**Detection Logic:**

1. Generate embedding vector for the new report's description
2. Compare against existing report embeddings using cosine similarity
3. Also consider location and category matching
4. If similarity exceeds threshold → mark as possible duplicate

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

| Field     | Type     | Notes                    |
| --------- | -------- | ------------------------ |
| id        | UUID     | Primary key              |
| name      | String   | Required                 |
| email     | String   | Unique                   |
| password  | String   | Hashed with bcryptjs     |
| role      | Role     | `user` or `admin`        |
| createdAt | DateTime | Auto-generated           |
| updatedAt | DateTime | Auto-updated             |

**Report Model:**

| Field           | Type           | Notes                              |
| --------------- | -------------- | ---------------------------------- |
| id              | UUID           | Primary key                        |
| name            | String?        | Optional reporter name             |
| contact         | String?        | Optional contact info              |
| location        | String         | Required                           |
| description     | String         | Required                           |
| language        | Language       | Default: `unknown`                 |
| category        | ReportCategory?| AI-generated                       |
| urgency         | UrgencyLevel?  | AI-generated                       |
| summary         | String?        | AI-generated                       |
| suggestedAction | String?        | AI-generated                       |
| confidence      | Float?         | AI confidence score (0–1)          |
| embedding       | Float[]        | bge-m3 vector for duplicate detect |
| possibleDuplicate | Boolean      | Default: `false`                   |
| matchedReportId | String?        | UUID of matched report             |
| status          | ReportStatus   | Default: `pending`                 |
| createdAt       | DateTime       | Auto-generated                     |
| updatedAt       | DateTime       | Auto-updated                       |

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

| Parameter  | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| category   | string | Filter by category enum value        |
| urgency    | string | Filter by urgency enum value         |
| status     | string | Filter by status enum value          |
| search     | string | Free-text search in description/location |
| startDate  | string | ISO date — filter reports created after  |
| endDate    | string | ISO date — filter reports created before |
| page       | number | Page number (default: 1)             |
| limit      | number | Items per page (default: 10)         |

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
      "fire": 5,
      "medical": 8,
      "flood": 3,
      "utility": 12,
      "accident": 4,
      "crime": 2,
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

---

### 9. Authentication

**Endpoint:** `POST /api/auth/login`

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
PORT=5000
APP_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=1d
GEMINI_API_KEY=your_gemini_api_key
```

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
    "total": 45
  }
}
```

The `meta` field is included only for paginated list endpoints.

---

## Scripts

```bash
npm run dev           # Start development server (tsx watch)
npm run build         # Compile TypeScript
npm start             # Run compiled output
npm run test          # Run all unit tests once
npm run test:coverage # Run with coverage report
```

---

## Testing

The project uses **Vitest** for unit testing with mocked dependencies.

### Test Folder Structure

Mirrors the `src/` directory for easy navigation:

```
src/
├── __tests__/
│   ├── setup.ts                          # Global test setup (env vars, mock resets)
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── embedding.test.ts         # cosineSimilarity pure logic
│   │   │   └── gemini.test.ts            # classifyReport (mocked Gemini API)
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   └── auth.service.test.ts  # login & register logic
│   │   │   └── report/
│   │   │       └── report.service.test.ts# createReport, duplicate detection
│   │   └── utils/
│   │       └── jwt.test.ts               # createToken & verifyToken
```

### Testing Strategy

**Unit Tests** — test isolated business logic with mocked dependencies (`vi.mock()`):

| File | What to Mock | What to Test |
|------|-------------|-------------|
| `lib/embedding.test.ts` | Nothing (pure math) | `cosineSimilarity` with known vectors (identical → 1, orthogonal → 0) |
| `lib/gemini.test.ts` | `@google/generative-ai` | Valid JSON parsing, invalid response → throws, confidence clamping (0–1) |
| `modules/auth/auth.service.test.ts` | `prisma`, `bcryptjs` | Admin-only login, duplicate email rejection, password mismatch, successful register |
| `modules/report/report.service.test.ts` | `prisma`, `lib/gemini`, `lib/embedding` | AI result mapping to DB, duplicate detection above/below threshold, empty candidates |
| `utils/jwt.test.ts` | Nothing (uses real jsonwebtoken) | Token creation with payload, valid verification, expired token rejection |

### Key Conventions

- **Mocking:** All external services (`Gemini API`, `Prisma`, `@xenova/transformers`) are mocked using `vi.mock()`
- **No database needed:** Unit tests never hit a real database — Prisma calls are fully mocked
- **No network calls:** Gemini and embedding model are mocked — tests run offline and fast
- **Isolation:** Each test file is self-contained with its own mocks — no shared state between files
- **Naming:** Test files use `.test.ts` suffix and live alongside the structure they test

### Running Tests

```bash
npm run test          # Run all unit tests once
npm run test:coverage # Run with coverage report
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
- [x] JWT Authentication for admin APIs
- [ ] Request rate limiting
- [x] Schema validation with Zod
- [ ] Swagger/OpenAPI documentation
- [ ] Docker support
- [x] Unit testing (Vitest)
- [x] Advanced duplicate detection using bge-m3 embeddings and cosine similarity
- [x] Clean modular architecture
- [x] Live deployment

---

## Deliverables

- Public GitHub repository
- Live deployed backend
- API documentation
- Architecture diagram
- Architecture explanation video
