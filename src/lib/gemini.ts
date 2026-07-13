import { GoogleGenerativeAI } from "@google/generative-ai";
import httpStatus from "http-status";
import config from "../config";
import { ApiError } from "../utils/ApiError";

const genAI = new GoogleGenerativeAI(config.gemini_api_key);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface IAIClassification {
  category: string;
  urgency: string;
  summary: string;
  canonicalSummary: string;
  normalizedLocation: string;
  suggestedAction: string;
  confidence: number;
}

export const classifyReport = async (
  description: string,
  location: string,
  language: string,
): Promise<IAIClassification> => {
  const summaryLanguageInstruction =
    language === "bn"
      ? "summary: a short one-line summary of the incident in Bangla"
      : language === "en"
        ? "summary: a short one-line summary of the incident in English"
        : "summary: a short one-line summary of the incident in the same language as the description";

  const prompt = `You are an emergency report classification AI. Analyze the following citizen report and return a JSON object with these fields:

- category: one of [medical, fire, accident, crime, flood, utility, public_service, infrastructure, other]
- urgency: one of [low, medium, high, critical]
- ${summaryLanguageInstruction}
- canonicalSummary: a short one-line summary of the incident ALWAYS in English (regardless of input language)
- normalizedLocation: the location standardized to a clean English format (e.g. "Bondor Bazar, Sylhet" instead of "সিলেট বন্দর বাজার" or "sylhet bondor bazar area"). Always use proper capitalization, remove informal words, and translate to English if needed.
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
    // Log full detail server-side, return a safe message client-side.
    console.error("[gemini] generateContent failed:", error);

    const status =
      // The SDK surfaces upstream HTTP status on `error.status`; fall back to 500.
      typeof (error as { status?: number })?.status === "number"
        ? (error as { status: number }).status
        : httpStatus.INTERNAL_SERVER_ERROR;

    const clientMessage =
      status === httpStatus.UNAUTHORIZED || status === httpStatus.FORBIDDEN
        ? "AI service authentication failed. Please contact support."
        : status === httpStatus.TOO_MANY_REQUESTS
          ? "AI service is rate-limited. Please try again shortly."
          : "AI classification failed. Please try again.";

    throw new ApiError(
      status === httpStatus.UNAUTHORIZED || status === httpStatus.FORBIDDEN
        ? httpStatus.INTERNAL_SERVER_ERROR
        : status,
      clientMessage,
    );
  }

  try {
    const parsed = JSON.parse(text) as IAIClassification;
    return {
      category: parsed.category,
      urgency: parsed.urgency,
      summary: parsed.summary,
      canonicalSummary: parsed.canonicalSummary,
      normalizedLocation: parsed.normalizedLocation || location,
      suggestedAction: parsed.suggestedAction,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
    };
  } catch (error) {
    console.error("[gemini] response parse failed:", error, { text });
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI classification failed. Please try again.",
    );
  }
};
