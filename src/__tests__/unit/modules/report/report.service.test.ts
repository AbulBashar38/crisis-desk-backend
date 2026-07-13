import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportService } from "../../../../modules/report/report.service";
import { prisma } from "../../../../lib/prisma";

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    report: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("../../../../lib/gemini", () => ({
  classifyReport: vi.fn().mockResolvedValue({
    category: "fire",
    urgency: "critical",
    summary: "Fire reported near a shop",
    suggestedAction: "Notify fire service immediately",
    confidence: 0.91,
  }),
}));

vi.mock("../../../../lib/embedding", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  cosineSimilarity: vi.fn(),
}));

describe("reportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReport", () => {
    it("should create a report with AI classification and no duplicate", async () => {
      const mockReport = {
        id: "report-1",
        name: "Rahim",
        contact: "017xxx",
        location: "Sylhet",
        description: "Fire near shop",
        language: "bn",
        category: "fire",
        urgency: "critical",
        summary: "Fire reported near a shop",
        suggestedAction: "Notify fire service immediately",
        confidence: 0.91,
        embedding: [0.1, 0.2, 0.3],
        possibleDuplicate: false,
        matchedReportId: null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.create).mockResolvedValue(mockReport as any);

      const result = await reportService.createReport({
        name: "Rahim",
        contact: "017xxx",
        location: "Sylhet",
        description: "Fire near shop",
        language: "bn",
      });

      expect(result).not.toHaveProperty("embedding");
      expect(result.category).toBe("fire");
      expect(result.urgency).toBe("critical");
      expect(result.possibleDuplicate).toBe(false);
      expect(prisma.report.create).toHaveBeenCalled();
    });

    it("should detect duplicate when similarity exceeds threshold", async () => {
      const { cosineSimilarity } = await import("../../../../lib/embedding");

      vi.mocked(cosineSimilarity).mockReturnValue(0.95);

      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { id: "existing-report-1", embedding: [0.1, 0.2, 0.3] },
      ] as any);

      const mockReport = {
        id: "report-2",
        name: "Karim",
        contact: null,
        location: "Sylhet",
        description: "Fire near shop again",
        language: "bn",
        category: "fire",
        urgency: "critical",
        summary: "Fire reported near a shop",
        suggestedAction: "Notify fire service immediately",
        confidence: 0.91,
        embedding: [0.1, 0.2, 0.3],
        possibleDuplicate: true,
        matchedReportId: "existing-report-1",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.report.create).mockResolvedValue(mockReport as any);

      const result = await reportService.createReport({
        name: "Karim",
        location: "Sylhet",
        description: "Fire near shop again",
        language: "bn",
      });

      expect(result.possibleDuplicate).toBe(true);
      expect(result.matchedReportId).toBe("existing-report-1");
    });

    it("should not detect duplicate when similarity is below threshold", async () => {
      const { cosineSimilarity } = await import("../../../../lib/embedding");

      vi.mocked(cosineSimilarity).mockReturnValue(0.5);

      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { id: "existing-report-1", embedding: [0.9, 0.8, 0.7] },
      ] as any);

      const mockReport = {
        id: "report-3",
        name: null,
        contact: null,
        location: "Dhaka",
        description: "Flood in area",
        language: "en",
        category: "fire",
        urgency: "critical",
        summary: "Fire reported near a shop",
        suggestedAction: "Notify fire service immediately",
        confidence: 0.91,
        embedding: [0.1, 0.2, 0.3],
        possibleDuplicate: false,
        matchedReportId: null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.report.create).mockResolvedValue(mockReport as any);

      const result = await reportService.createReport({
        location: "Dhaka",
        description: "Flood in area",
        language: "en",
      });

      expect(result.possibleDuplicate).toBe(false);
      expect(result.matchedReportId).toBeNull();
    });

    it("should skip candidates with empty embeddings", async () => {
      const { cosineSimilarity } = await import("../../../../lib/embedding");

      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { id: "empty-embedding", embedding: [] },
        { id: "valid-embedding", embedding: [0.5, 0.5, 0.5] },
      ] as any);

      vi.mocked(cosineSimilarity).mockReturnValue(0.4);

      const mockReport = {
        id: "report-4",
        location: "Chittagong",
        description: "Accident",
        language: "unknown",
        category: "fire",
        urgency: "critical",
        summary: "Fire reported near a shop",
        suggestedAction: "Notify fire service immediately",
        confidence: 0.91,
        embedding: [0.1, 0.2, 0.3],
        possibleDuplicate: false,
        matchedReportId: null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.report.create).mockResolvedValue(mockReport as any);

      await reportService.createReport({
        location: "Chittagong",
        description: "Accident",
      });

      // cosineSimilarity should only be called once (skipped empty embedding)
      expect(cosineSimilarity).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAllReports", () => {
    it("should return paginated reports with meta", async () => {
      const mockReports = [
        { id: "r1", location: "Dhaka", status: "pending" },
        { id: "r2", location: "Sylhet", status: "resolved" },
      ];

      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports as any);
      vi.mocked(prisma.report.count).mockResolvedValue(20);

      const result = await reportService.getAllReports({ page: 2, limit: 5 });

      expect(result.reports).toEqual(mockReports);
      expect(result.meta).toEqual({ page: 2, limit: 5, total: 20 });
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it("should apply category and urgency filters", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      await reportService.getAllReports({ category: "fire", urgency: "critical" });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: "fire",
            urgency: "critical",
          }),
        }),
      );
    });

    it("should apply search filter on description and location", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      await reportService.getAllReports({ search: "flood" });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { description: { contains: "flood", mode: "insensitive" } },
              { location: { contains: "flood", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should use default page=1 and limit=10 when not provided", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      const result = await reportService.getAllReports({});

      expect(result.meta).toEqual({ page: 1, limit: 10, total: 0 });
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe("getReportById", () => {
    it("should return report if found", async () => {
      const mockReport = { id: "r1", location: "Dhaka", status: "pending" };
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport as any);

      const result = await reportService.getReportById("r1");

      expect(result).toEqual(mockReport);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: "r1" },
        omit: { embedding: true },
      });
    });

    it("should throw error if report not found", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await expect(reportService.getReportById("invalid-id")).rejects.toThrow(
        "Report not found.",
      );
    });
  });

  describe("updateReportStatus", () => {
    it("should update status successfully", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue({ id: "r1" } as any);

      const updatedReport = {
        id: "r1",
        status: "assigned",
        embedding: [0.1, 0.2],
        updatedAt: new Date(),
      };
      vi.mocked(prisma.report.update).mockResolvedValue(updatedReport as any);

      const result = await reportService.updateReportStatus("r1", {
        status: "assigned",
      });

      expect(result.status).toBe("assigned");
      expect(result).not.toHaveProperty("embedding");
    });

    it("should throw error if report not found", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await expect(
        reportService.updateReportStatus("invalid-id", { status: "resolved" }),
      ).rejects.toThrow("Report not found.");
    });
  });

  describe("deleteReport", () => {
    it("should delete report successfully", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue({ id: "r1" } as any);

      const deletedReport = {
        id: "r1",
        location: "Dhaka",
        embedding: [0.1, 0.2],
      };
      vi.mocked(prisma.report.delete).mockResolvedValue(deletedReport as any);

      const result = await reportService.deleteReport("r1");

      expect(result.id).toBe("r1");
      expect(result).not.toHaveProperty("embedding");
      expect(prisma.report.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
    });

    it("should throw error if report not found", async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await expect(reportService.deleteReport("invalid-id")).rejects.toThrow(
        "Report not found.",
      );
    });
  });

  describe("getStatsSummary", () => {
    it("should return correct analytics summary", async () => {
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(45)  // totalReports
        .mockResolvedValueOnce(18)  // pendingReports
        .mockResolvedValueOnce(7)   // criticalReports
        .mockResolvedValueOnce(10); // resolvedReports

      vi.mocked(prisma.report.groupBy)
        .mockResolvedValueOnce([
          { category: "fire", _count: { category: 5 } },
          { category: "medical", _count: { category: 8 } },
        ] as any)
        .mockResolvedValueOnce([
          { urgency: "low", _count: { urgency: 9 } },
          { urgency: "critical", _count: { urgency: 7 } },
        ] as any);

      const result = await reportService.getStatsSummary();

      expect(result.totalReports).toBe(45);
      expect(result.pendingReports).toBe(18);
      expect(result.criticalReports).toBe(7);
      expect(result.resolvedReports).toBe(10);
      expect(result.categoryBreakdown).toEqual({ fire: 5, medical: 8 });
      expect(result.urgencyBreakdown).toEqual({ low: 9, critical: 7 });
    });
  });
});
