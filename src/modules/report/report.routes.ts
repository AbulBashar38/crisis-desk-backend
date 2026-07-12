import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { reportController } from "./report.controller";
import { createReportValidationSchema } from "./report.validation";

const router = Router();

router.post("/", validateRequest(createReportValidationSchema), reportController.createReport);

export const reportRoutes = router;
