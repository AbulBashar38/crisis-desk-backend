import { generateEmbedding, cosineSimilarity } from "../../lib/embedding";
import { classifyReport } from "../../lib/gemini";
import { prisma } from "../../lib/prisma";
import { ICreateReport } from "./report.interface";

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

export const reportService = {
  createReport,
};
