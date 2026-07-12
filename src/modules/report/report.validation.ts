import { z } from "zod";
import { Language, ReportStatus } from "../../../generated/prisma/enums";

const languageValues = Object.values(Language) as [string, ...string[]];
const reportStatusValues = Object.values(ReportStatus) as [string, ...string[]];

export const createReportValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    contact: z.string().optional(),
    location: z
      .string({ required_error: "Location is required" })
      .min(1, "Location is required"),
    description: z
      .string({ required_error: "Description is required" })
      .min(1, "Description is required"),
    language: z.enum(languageValues).default("unknown"),
  }),
});

export const updateReportStatusValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Report id is required"),
  }),
  body: z.object({
    status: z.enum(reportStatusValues),
  }),
});

export const reportIdParamsValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Report id is required"),
  }),
});
