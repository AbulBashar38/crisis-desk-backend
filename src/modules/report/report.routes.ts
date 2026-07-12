import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { reportController } from "./report.controller";
import {
  createReportValidationSchema,
  reportIdParamsValidationSchema,
  updateReportStatusValidationSchema,
} from "./report.validation";

const router = Router();

router.post("/", validateRequest(createReportValidationSchema), reportController.createReport);
router.get("/", auth("admin"), reportController.getAllReports);
router.get("/stats/summary", auth("admin"), reportController.getStatsSummary);
router.get("/:id", auth("admin"), reportController.getReportById);
router.patch(
  "/:id/status",
  auth("admin"),
  validateRequest(updateReportStatusValidationSchema),
  reportController.updateReportStatus,
);
router.delete(
  "/:id",
  auth("admin"),
  validateRequest(reportIdParamsValidationSchema),
  reportController.deleteReport,
);

export const reportRoutes = router;
