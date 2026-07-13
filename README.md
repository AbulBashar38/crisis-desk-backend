# CrisisDesk AI - Intelligent Backend API for Emergency & Service Request Triage

## Overview

CrisisDesk AI is a backend-only REST API that intelligently processes emergency reports and public service complaints. The system accepts citizen reports, classifies them using Google Gemini AI, assigns urgency levels, detects duplicate reports using bge-m3 embeddings with cosine similarity, and provides admin APIs for report management and analytics.

**Key highlights:**

- AI-powered classification & summarization (Bangla + English)
- Multilingual duplicate detection using local embeddings + cosine similarity
- Location normalization via Gemini for consistent cross-language matching
- JWT authentication for admin endpoints
- Rate limiting, Zod validation, Swagger docs
- 51 unit tests with Vitest

---

## Live Deployment

| Resource | URL |
|----------|-----|
| **Base URL** | https://crisis-desk-backend.onrender.com |
| **Swagger API Docs** | https://crisis-desk-backend.onrender.com/api/docs |
| **GitHub Repository** | https://github.com/AbulBashar38/crisis-desk-backend |

---

## Architecture Diagram

![CrisisDesk AI Architecture](./images/archi.png)

---

## Video Explanation

- **Part 1 —API Walkthrough & Demo:** https://www.loom.com/share/87648680af7846adbe20488bf1266e25
- **Part 2 —  Architecture & Design:** https://www.loom.com/share/cb232dad486c401e8468fc88b6ba528d

## Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Runtime        | Node.js                                            |
| Framework      | Express.js 5                                       |
| Language       | TypeScript                                         |
| ORM            | Prisma (multi-file schema)                         |
| Database       | PostgreSQL (Neon DB)                               |
| AI             | Google Gemini API (classification & summarization) |
| Embeddings     | bge-m3 via `@xenova/transformers` (local, free)    |
| Similarity     | Cosine Similarity                                  |
| Validation     | Zod                                                |
| Auth           | JWT + bcryptjs (cookie or Bearer header)           |
| Rate Limiting  | `express-rate-limit`                               |
| Docs           | `swagger-jsdoc` + `swagger-ui-express`             |
| Testing        | Vitest + Supertest                                 |

---

## API Endpoints

| Method | Endpoint                     | Auth     | Description                |
| ------ | ---------------------------- | -------- | -------------------------- |
| POST   | `/api/auth/register`         | No       | Register admin/user        |
| POST   | `/api/auth/login`            | No       | Admin login → JWT token    |
| POST   | `/api/reports`               | No       | Submit a new report        |
| GET    | `/api/reports`               | Admin    | List reports (filters + pagination) |
| GET    | `/api/reports/:id`           | Admin    | Get single report          |
| PATCH  | `/api/reports/:id/status`    | Admin    | Update report status       |
| DELETE | `/api/reports/:id`           | Admin    | Delete a report            |
| GET    | `/api/reports/stats/summary` | Admin    | Analytics summary          |

---

## Report Submission Flow

When `POST /api/reports` is called:

1. **Validate** — Zod checks required fields (description, location)
2. **AI Classify** — Gemini returns category, urgency, summary (in report language), canonicalSummary (English), normalizedLocation (English), suggestedAction, confidence
3. **Generate Embedding** — bge-m3 creates vector from: `Category + normalizedLocation + canonicalSummary`
4. **Duplicate Detection** — Fetch candidates (same category, last 24h, not rejected), compare via cosine similarity (threshold > 0.90)
5. **Save** — Store everything in PostgreSQL
6. **Respond** — Return full report with AI fields + duplicate result

---

## Duplicate Detection Strategy

```
Embedding Input (always English, regardless of report language):
─────────────────────────────────────────────────────────────────
Category: fire
Location: Bondor Bazar, Sylhet          ← Gemini-normalized
Summary: Fire near a shop with trapped  ← canonicalSummary
─────────────────────────────────────────────────────────────────
```

- Cross-language: Bangla and English reports about the same event produce similar embeddings
- Candidate filtering: Same category + last 24 hours + not rejected (avoids scanning entire DB)
- Threshold: 0.90 cosine similarity → `possibleDuplicate: true`

---

## Project Structure

```
src/
├── app.ts                    # Express app, middleware, routes
├── server.ts                 # Server bootstrap
├── config/index.ts           # Environment config
├── lib/
│   ├── embedding.ts          # bge-m3 embedder + cosineSimilarity
│   ├── gemini.ts             # Gemini AI client (primary + fallback model)
│   ├── prisma.ts             # Prisma client
│   └── swagger.ts            # OpenAPI spec
├── middlewares/
│   ├── auth.ts               # JWT role-based auth
│   ├── globalErrorHandler.ts # Centralized error handler
│   ├── validateRequest.ts    # Zod validation wrapper
│   └── notFound.ts           # 404 handler
├── modules/
│   ├── auth/                 # register, login
│   └── report/               # CRUD + AI + analytics
├── utils/
│   ├── catchAsync.ts
│   ├── jwt.ts
│   └── sendResponse.ts
└── __tests__/                # Unit + integration tests (51 tests)
```

---

## Setup & Installation

```bash
git clone https://github.com/AbulBashar38/crisis-desk-backend.git
cd crisis-desk-backend
npm install
cp .env.example .env   # Fill in environment variables
npx prisma generate
npx prisma db push
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/crisisdesk
PORT=8080
APP_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=1d
GEMINI_API_KEY=your_gemini_api_key
```

---

## Scripts

```bash
npm run dev    # Development server (tsx watch)
npm start      # Production server (tsx)
npm test       # Run all 51 tests (vitest)
```

---

## Testing

51 tests across 7 test files using Vitest:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `embedding.test.ts` | 9 | cosineSimilarity math (identical, orthogonal, commutative) |
| `gemini.test.ts` | 7 | AI response parsing, confidence clamping, error handling |
| `auth.service.test.ts` | 6 | Register, login, admin-only, password mismatch |
| `report.service.test.ts` | 15 | CRUD, duplicate detection, analytics |
| `auth.test.ts` (middleware) | 7 | Token extraction, role check, missing token |
| `jwt.test.ts` | 5 | Create, verify, expired, wrong secret |
| `create-report.test.ts` | 2 | Validation errors (integration) |

```bash
npm test   # All pass in <1 second
```

---

## Bonus Features

- [x] Bangla & English language support
- [x] JWT Authentication for admin APIs
- [x] Request rate limiting (100 req/15min global)
- [x] Schema validation with Zod
- [x] Swagger/OpenAPI documentation
- [x] Unit & Integration testing (51 tests)
- [x] Advanced duplicate detection (bge-m3 embeddings + cosine similarity)
- [x] AI-powered location normalization for cross-language matching
- [x] Gemini model fallback (primary → fallback on rate limit)
- [x] Clean modular architecture
- [x] Live deployment on Render

---

## Deliverables

- [x] Public GitHub repository
- [x] Live deployed backend
- [x] API documentation (Swagger)
- [x] Architecture diagram
- [x] Architecture explanation video


