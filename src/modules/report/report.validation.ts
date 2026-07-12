import { z } from "zod";
import { Language } from "../../../generated/prisma/enums";

const languageValues = Object.values(Language) as [string, ...string[]];

export const createReportValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    contact: z.string().optional(),
    location: z.string({ required_error: "Location is required" }).min(1, "Location is required"),
    description: z.string({ required_error: "Description is required" }).min(1, "Description is required"),
    language: z.enum(languageValues).default("unknown"),
  }),
});
