import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { reportSubmitLimiter } from "../../middlewares/rateLimiter";
import { validateRequest } from "../../middlewares/validateRequest";
import { reportController } from "./report.controller";
import {
  createReportValidationSchema,
  reportIdParamsValidationSchema,
  updateReportStatusValidationSchema,
} from "./report.validation";

const router = Router();

/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: Submit a new emergency report
 *     description: |
 *       Accepts a citizen's emergency report, runs Gemini AI classification, generates a
 *       bge-m3 embedding, performs duplicate detection, and persists the report.
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, location]
 *             properties:
 *               name: { type: string, example: "Rahim Uddin" }
 *               contact: { type: string, example: "+8801711000000" }
 *               location: { type: string, example: "Mirpur 10, Dhaka" }
 *               description:
 *                 type: string
 *                 example: "A fire has broken out near a shop with possible trapped people."
 *               language: { type: string, enum: [bn, en, unknown], example: en }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CreateReportResponse"
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: Report submitted successfully
 *               data:
 *                 id: "5f0a2c8e-1b6d-4a2e-9b1c-0e7a2b0d6f01"
 *                 name: "Rahim Uddin"
 *                 contact: "+8801711000000"
 *                 location: "Mirpur 10, Dhaka"
 *                 description: "A fire has broken out near a shop with possible trapped people."
 *                 language: "en"
 *                 category: "fire"
 *                 urgency: "critical"
 *                 summary: "A fire has been reported near a shop with possible trapped people."
 *                 suggestedAction: "Immediately notify fire service and emergency responders."
 *                 confidence: 0.91
 *                 possibleDuplicate: false
 *                 matchedReportId: null
 *                 status: "pending"
 *                 createdAt: "2026-07-13T10:30:00.000Z"
 *                 updatedAt: "2026-07-13T10:30:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               statusCode: 400
 *               message: "Description and location are required."
 *               errors:
 *                 - field: "body.description"
 *                   message: "Description is required"
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 429
 *               message: "Too many reports submitted. Please try again later."
 *       500:
 *         description: AI classification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               statusCode: 500
 *               message: "AI classification failed. Please try again."
 */
router.post(
  "/",
  reportSubmitLimiter,
  validateRequest(createReportValidationSchema),
  reportController.createReport,
);

/**
 * @openapi
 * /api/reports:
 *   get:
 *     summary: List reports (admin)
 *     description: Returns a paginated list of reports. Supports filtering and free-text search.
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [fire, flood, medical, accident, crime, infrastructure, other] }
 *       - in: query
 *         name: urgency
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_review, assigned, resolved, rejected] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedReportsResponse"
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Reports retrieved successfully"
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 45
 *                 totalPages: 5
 *               data:
 *                 - id: "5f0a2c8e-1b6d-4a2e-9b1c-0e7a2b0d6f01"
 *                   location: "Mirpur 10, Dhaka"
 *                   description: "A fire has broken out near a shop with possible trapped people."
 *                   category: "fire"
 *                   urgency: "critical"
 *                   status: "pending"
 *                   possibleDuplicate: false
 *                   matchedReportId: null
 *                   createdAt: "2026-07-13T10:30:00.000Z"
 *                   updatedAt: "2026-07-13T10:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "You are not authorized. Please log in."
 */
router.get("/", auth("admin"), reportController.getAllReports);

/**
 * @openapi
 * /api/reports/stats/summary:
 *   get:
 *     summary: Analytics summary (admin)
 *     description: Returns aggregated report statistics for the admin dashboard.
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StatsSummaryResponse"
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Analytics summary retrieved successfully"
 *               data:
 *                 totalReports: 45
 *                 pendingReports: 18
 *                 criticalReports: 7
 *                 resolvedReports: 10
 *                 categoryBreakdown:
 *                   fire: 5
 *                   flood: 8
 *                   medical: 12
 *                   accident: 6
 *                   crime: 4
 *                   infrastructure: 7
 *                   other: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "You are not authorized. Please log in."
 */
router.get("/stats/summary", auth("admin"), reportController.getStatsSummary);

/**
 * @openapi
 * /api/reports/{id}:
 *   get:
 *     summary: Get a single report (admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SingleReportResponse"
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Report retrieved successfully"
 *               data:
 *                 id: "5f0a2c8e-1b6d-4a2e-9b1c-0e7a2b0d6f01"
 *                 location: "Mirpur 10, Dhaka"
 *                 description: "A fire has broken out near a shop with possible trapped people."
 *                 category: "fire"
 *                 urgency: "critical"
 *                 status: "pending"
 *                 possibleDuplicate: false
 *                 matchedReportId: null
 *                 createdAt: "2026-07-13T10:30:00.000Z"
 *                 updatedAt: "2026-07-13T10:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "You are not authorized. Please log in."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               message: "Report not found."
 */
router.get("/:id", auth("admin"), reportController.getReportById);

/**
 * @openapi
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Update report status (admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_review, assigned, resolved, rejected]
 *                 example: assigned
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SingleReportResponse"
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Report status updated successfully"
 *               data:
 *                 id: "5f0a2c8e-1b6d-4a2e-9b1c-0e7a2b0d6f01"
 *                 status: "assigned"
 *                 updatedAt: "2026-07-13T11:05:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 400
 *               message: "Validation failed"
 *               errors:
 *                 - field: "body.status"
 *                   message: "Invalid status value"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "You are not authorized. Please log in."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               message: "Report not found."
 */
router.patch(
  "/:id/status",
  auth("admin"),
  validateRequest(updateReportStatusValidationSchema),
  reportController.updateReportStatus,
);

/**
 * @openapi
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a report (admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Report deleted successfully"
 *               data:
 *                 id: "5f0a2c8e-1b6d-4a2e-9b1c-0e7a2b0d6f01"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 401
 *               message: "You are not authorized. Please log in."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               message: "Report not found."
 */
router.delete(
  "/:id",
  auth("admin"),
  validateRequest(reportIdParamsValidationSchema),
  reportController.deleteReport,
);

export const reportRoutes = router;
