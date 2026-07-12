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

const getAllReports = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const filters = {
      category: req.query.category as string | undefined,
      urgency: req.query.urgency as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const { reports, meta } = await reportService.getAllReports(filters);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reports retrieved successfully",
      data: reports,
      meta,
    });
  },
);

const getReportById = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const report = await reportService.getReportById(req.params.id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Report retrieved successfully",
      data: report,
    });
  },
);

const updateReportStatus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const report = await reportService.updateReportStatus(
      req.params.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Report status updated successfully",
      data: report,
    });
  },
);

const deleteReport = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const report = await reportService.deleteReport(req.params.id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Report deleted successfully",
      data: report,
    });
  },
);

const getStatsSummary = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await reportService.getStatsSummary();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Analytics summary retrieved successfully",
      data: stats,
    });
  },
);

export const reportController = {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getStatsSummary,
};
