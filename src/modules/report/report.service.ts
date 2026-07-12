import { classifyReport } from "../../lib/gemini";
import { ICreateReport } from "./report.interface";

const createReport = async (payload: ICreateReport) => {
  const { name, contact, location, description, language } = payload;
  const lang = language || "unknown";

  // AI Classification
  const aiResult = await classifyReport(description, location, lang);

  // Generate embedding for duplicate detection
  // const embedding = await generateEmbedding(description);

  // TODO: Duplicate detection logic here

  // const report = await prisma.report.create({
  //   data: {
  //     name,
  //     contact,
  //     location,
  //     description,
  //     language: lang,
  //     category: aiResult.category as any,
  //     urgency: aiResult.urgency as any,
  //     summary: aiResult.summary,
  //     suggestedAction: aiResult.suggestedAction,
  //     confidence: aiResult.confidence,
  //     embedding,
  //   },
  // });

  return aiResult;
};

export const reportService = {
  createReport,
};
