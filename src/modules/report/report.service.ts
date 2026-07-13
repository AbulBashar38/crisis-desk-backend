import httpStatus from "http-status";
import { cosineSimilarity, generateEmbedding } from "../../lib/embedding";
import { classifyReport } from "../../lib/gemini";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  ICreateReport,
  IReportFilters,
  IUpdateReportStatus,
} from "./report.interface";

const DUPLICATE_THRESHOLD = 0.9;

const createReport = async (payload: ICreateReport) => {
  const { name, contact, location, description, language } = payload;
  const lang = language || "unknown";

  // Step 2: AI Classification
  const aiResult = await classifyReport(description, location, lang);

  // Step 3: Generate Embedding using standardized text
  const embeddingInput = `Category: ${aiResult.category}\nLocation: ${location}\nSummary: ${aiResult.summary}`;
  const embedding = await generateEmbedding(embeddingInput);

  // Step 4: Duplicate Detection
  let possibleDuplicate = false;
  let matchedReportId: string | null = null;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const candidates = await prisma.report.findMany({
    where: {
      category: aiResult.category as any,
      status: { not: "rejected" },
      createdAt: { gte: twentyFourHoursAgo },
    },
    select: {
      id: true,
      embedding: true,
    },
  });

  let highestSimilarity = 0;

  for (const candidate of candidates) {
    if (candidate.embedding.length === 0) continue;

    const similarity = cosineSimilarity(embedding, candidate.embedding);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;

      if (similarity > DUPLICATE_THRESHOLD) {
        possibleDuplicate = true;
        matchedReportId = candidate.id;
      }
    }
  }

  // Step 5: Save Report
  const report = await prisma.report.create({
    data: {
      name,
      contact,
      location,
      description,
      language: lang,
      category: aiResult.category as any,
      urgency: aiResult.urgency as any,
      summary: aiResult.summary,
      suggestedAction: aiResult.suggestedAction,
      confidence: aiResult.confidence,
      embedding,
      possibleDuplicate,
      matchedReportId,
    },
  });

  // Step 6: Return without embedding (large array, not useful in response)
  const { embedding: _embedding, ...reportResponse } = report;
  return reportResponse;
};

const getAllReports = async (filters: IReportFilters) => {
  const {
    category,
    urgency,
    status,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (category) where.category = category;
  if (urgency) where.urgency = urgency;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      omit: { embedding: true },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports,
    meta: { page, limit, total },
  };
};

const getReportById = async (id: string) => {
  const report = await prisma.report.findUnique({
    where: { id },
    omit: { embedding: true },
  });

  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found.");
  }

  return report;
};

const updateReportStatus = async (id: string, payload: IUpdateReportStatus) => {
  const existingReport = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingReport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found.");
  }

  const updatedReport = await prisma.report.update({
    where: { id },
    data: { status: payload.status },
  });

  const { embedding: _embedding, ...reportResponse } = updatedReport;
  return reportResponse;
};

const deleteReport = async (id: string) => {
  const existingReport = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingReport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Report not found.");
  }

  const deletedReport = await prisma.report.delete({
    where: { id },
  });

  const { embedding: _embedding, ...reportResponse } = deletedReport;
  return reportResponse;
};

const getStatsSummary = async () => {
  const [
    totalReports,
    pendingReports,
    criticalReports,
    resolvedReports,
    categoryBreakdownRaw,
    urgencyBreakdownRaw,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { urgency: "critical" } }),
    prisma.report.count({ where: { status: "resolved" } }),
    prisma.report.groupBy({ by: ["category"], _count: { category: true } }),
    prisma.report.groupBy({ by: ["urgency"], _count: { urgency: true } }),
  ]);

  const categoryBreakdown: Record<string, number> = {};
  for (const item of categoryBreakdownRaw) {
    if (item.category) {
      categoryBreakdown[item.category] = item._count.category;
    }
  }

  const urgencyBreakdown: Record<string, number> = {};
  for (const item of urgencyBreakdownRaw) {
    if (item.urgency) {
      urgencyBreakdown[item.urgency] = item._count.urgency;
    }
  }

  return {
    totalReports,
    pendingReports,
    criticalReports,
    resolvedReports,
    categoryBreakdown,
    urgencyBreakdown,
  };
};

export const reportService = {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getStatsSummary,
};
