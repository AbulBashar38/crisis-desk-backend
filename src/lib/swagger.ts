import swaggerJSDoc from "swagger-jsdoc";
import config from "../config/index.js";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CrisisDesk AI API",
      version: "1.0.0",
      description:
        "Intelligent backend API for emergency & service request triage.",
    },
    servers: [
      ...(process.env.PUBLIC_URL
        ? [
            {
              url: process.env.PUBLIC_URL,
              description: "Live (production)",
            },
          ]
        : []),
      {
        url: `http://localhost:${config.port}`,
        description: "Local development",
      },
    ],
    components: {
      // OpenAPI component types are validated at runtime by Swagger UI;
      // cast to `any` so TypeScript doesn't reject unquoted string-literal types.
      ...({
        securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            statusCode: { type: "integer", example: 400 },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "body.email" },
                  message: { type: "string", example: "Invalid email" },
                },
              },
            },
          },
        },
        Report: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", nullable: true },
            contact: { type: "string", nullable: true },
            location: { type: "string" },
            description: { type: "string" },
            language: {
              type: "string",
              enum: ["bn", "en", "unknown"],
              default: "unknown",
            },
            category: {
              type: "string",
              nullable: true,
              enum: [
                "fire",
                "flood",
                "medical",
                "accident",
                "crime",
                "infrastructure",
                "other",
              ],
            },
            urgency: {
              type: "string",
              nullable: true,
              enum: ["low", "medium", "high", "critical"],
            },
            summary: { type: "string", nullable: true },
            suggestedAction: { type: "string", nullable: true },
            confidence: { type: "number", format: "float", minimum: 0, maximum: 1 },
            possibleDuplicate: { type: "boolean", default: false },
            matchedReportId: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["pending", "in_review", "assigned", "resolved", "rejected"],
              default: "pending",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["user", "admin"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SingleReportResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Report retrieved successfully" },
            data: { $ref: "#/components/schemas/Report" },
          },
        },
        CreateReportResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 201 },
            message: { type: "string", example: "Report submitted successfully" },
            data: { $ref: "#/components/schemas/Report" },
          },
        },
        PaginatedReportsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Reports retrieved successfully" },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                total: { type: "integer", example: 45 },
                totalPages: { type: "integer", example: 5 },
              },
            },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Report" },
            },
          },
        },
        StatsSummaryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: {
              type: "string",
              example: "Analytics summary retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                totalReports: { type: "integer", example: 45 },
                pendingReports: { type: "integer", example: 18 },
                criticalReports: { type: "integer", example: 7 },
                resolvedReports: { type: "integer", example: 10 },
                categoryBreakdown: {
                  type: "object",
                  additionalProperties: { type: "integer" },
                  example: { fire: 5, flood: 8, medical: 12 },
                },
              },
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 201 },
            message: { type: "string", example: "User registered successfully" },
            data: { $ref: "#/components/schemas/User" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
      },
      } as any),
    },
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);