# CrisisDesk AI - Intelligent Backend API for Emergency & Service Request Triage

## Overview

CrisisDesk AI is a backend-only REST API designed to intelligently process emergency reports and public service complaints. The system accepts citizen reports, analyzes them using AI, prioritizes incidents based on urgency, detects potential duplicate reports, and provides administrative APIs for report management and analytics.

This project focuses entirely on backend engineering, API design, database modeling, AI integration, validation, and documentation. No frontend implementation is required.

---

# Problem Statement

Emergency reports often arrive through unstructured and inconsistent channels such as phone calls, text messages, social media posts, or manually written descriptions. These reports are frequently:

- Unstructured or incomplete
- Written in multiple languages
- Duplicated by different citizens
- Difficult to classify and prioritize

The objective of this project is to build an AI-powered backend system capable of transforming these raw reports into structured, actionable incidents.

---

# Core Features

## 1. Report Submission

Citizens can submit emergency reports through a REST API.

Each report contains:

- Name (optional)
- Contact information (optional)
- Location
- Description
- Language (bn | en | unknown)

The system validates incoming requests before processing.

---

## 2. AI Classification & Summarization

After receiving a report, the system uses an AI model to analyze the incident and generate:

- Category
- Urgency
- Summary
- Suggested Action
- Confidence Score

### Allowed Categories

- medical
- fire
- accident
- crime
- flood
- utility
- public_service
- infrastructure
- other

### Allowed Urgency Levels

- low
- medium
- high
- critical

---

## 3. Duplicate Report Detection

The system identifies whether a newly submitted report is potentially describing an already existing incident.

Duplicate detection considers:

- Location similarity
- Category similarity
- Description similarity

The implementation may use:

- Keyword matching
- Text similarity
- AI embeddings
- Cosine similarity
- Location normalization
- Hybrid matching strategies

Each report stores:

- `possibleDuplicate`
- `matchedReportId`

---

## 4. Persistent Storage

All reports are permanently stored in Neon DB through Prisma.

Each report stores both the original user submission and AI-generated metadata, including:

- Reporter information
- Original description
- AI classification
- AI summary
- Suggested action
- Confidence score
- Duplicate detection result
- Current report status
- Timestamps

---

## 5. Report Management APIs

The backend provides complete CRUD operations for reports.

### Required Endpoints

| Method | Endpoint                     | Description                |
| ------ | ---------------------------- | -------------------------- |
| POST   | `/api/reports`               | Submit a new report        |
| GET    | `/api/reports`               | Retrieve all reports       |
| GET    | `/api/reports/:id`           | Retrieve a single report   |
| PATCH  | `/api/reports/:id/status`    | Update report status       |
| DELETE | `/api/reports/:id`           | Delete a report            |
| GET    | `/api/reports/stats/summary` | Retrieve analytics summary |

---

## 6. Report Filtering

The report listing endpoint supports filtering using one or more of the following:

- Category
- Urgency
- Status
- Free-text search
- Date range

Example:

```http
GET /api/reports?category=fire&urgency=critical
```

---

## 7. Report Status Management

Administrators can update report workflow status.

Allowed status values:

- pending
- in_review
- assigned
- resolved
- rejected

---

## 8. Analytics

The system provides aggregated statistics for administrative dashboards.

Analytics include:

- Total reports
- Pending reports
- Critical reports
- Resolved reports
- Category breakdown
- Urgency breakdown

---

## 9. AI Integration

The backend integrates with an external AI service for:

- Incident classification
- Urgency prediction
- Summary generation
- Recommended responder action

The AI integration is a core feature of the application and its output is stored as part of every processed report.

---

## 10. Validation

Incoming requests are validated before processing.

Validation includes:

- Required fields
- Allowed language values
- Empty request prevention
- Invalid payload rejection

Invalid requests return structured error responses.

---

## 11. Error Handling

The API returns consistent and structured error responses for all failure scenarios.

Examples include:

- Validation errors
- Report not found
- AI processing failure
- Internal server errors

---

# Report Data Model

Each report contains the following information:

- id
- name
- contact
- location
- description
- language
- category
- urgency
- summary
- suggestedAction
- confidence
- possibleDuplicate
- matchedReportId
- status
- createdAt
- updatedAt

---

# Technology Decisions

This implementation uses:

- Node.js
- Express.js
- TypeScript
- Prisma
- Neon DB
- Gemini AI
- bge-m3 Embedding Model (for multilingual duplicate detection)
- Cosine Similarity
- Zod Validation

---

# Bonus Features

The project aims to include the following bonus features:

- Bangla & English language support
- JWT Authentication for admin APIs
- Request rate limiting
- Schema validation with Zod
- Swagger/OpenAPI documentation
- Docker support
- Unit & Integration testing
- Advanced duplicate detection using local embeddings and cosine similarity
- Clean modular architecture
- Live deployment

---

# Deliverables

The final submission includes:

- Public GitHub repository
- Live deployed backend
- API documentation
- Architecture diagram
- Architecture explanation video
