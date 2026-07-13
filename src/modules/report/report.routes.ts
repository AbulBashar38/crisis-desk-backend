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
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, location]
 *             properties:
 *               name: { type: string }
 *               contact: { type: string }
 *               location: { type: string }
 *               description: { type: string }
 *               language: { type: string, enum: [bn, en, unknown] }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       429: { description: Too many requests }
 *       500: { description: AI classification failed }
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
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: urgency
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
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
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.get("/", auth("admin"), reportController.getAllReports);

/**
 * @openapi
 * /api/reports/stats/summary:
 *   get:
 *     summary: Analytics summary (admin)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
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
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       404: { description: Report not found }
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
 *     responses:
 *       200: { description: OK }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       404: { description: Report not found }
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
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       404: { description: Report not found }
 */
router.delete(
  "/:id",
  auth("admin"),
  validateRequest(reportIdParamsValidationSchema),
  reportController.deleteReport,
);

export const reportRoutes = router;
