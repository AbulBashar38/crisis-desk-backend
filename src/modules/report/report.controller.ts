import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reportService } from "./report.service";

const createReport = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const report = await reportService.createReport(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Report submitted successfully",
      data: report,
    });
  },
);

export const reportController = {
  createReport,
};
