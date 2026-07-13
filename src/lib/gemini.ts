import { GoogleGenerativeAI } from "@google/generative-ai";
import httpStatus from "http-status";
import config from "../config";
import { ApiError } from "../utils/ApiError";

const genAI = new GoogleGenerativeAI(config.gemini_api_key);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
export interface IAIClassification {
  category: string;
  urgency: string;
  summary: string;
  suggestedAction: string;
  confidence: number;
}

export const classifyReport = async (
  description: string,
  location: string,
  language: string,
): Promise<IAIClassification> => {
  const prompt = `You are an emergency report classification AI. Analyze the following citizen report and return a JSON object with these fields:

- category: one of [medical, fire, accident, crime, flood, utility, public_service, infrastructure, other]
- urgency: one of [low, medium, high, critical]
- summary: a short one-line summary of the incident in English
- suggestedAction: recommended action for emergency responders in English
- confidence: a number between 0 and 1 representing your confidence in the classification

Report Details:
- Description: "${description}"
- Location: "${location}"
- Language: "${language}"

Respond ONLY with a valid JSON object. No markdown, no explanation, no code fences.`;

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text().trim();
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error && error.message
        ? error.message
        : "AI classification failed. Please try again."
    );
  }

  try {
    const parsed = JSON.parse(text) as IAIClassification;
    return {
      category: parsed.category,
      urgency: parsed.urgency,
      summary: parsed.summary,
      suggestedAction: parsed.suggestedAction,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
    };
  } catch {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI classification failed. Please try again."
    );
  }
};
