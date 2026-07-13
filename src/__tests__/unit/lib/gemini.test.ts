import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent };
      }
    },
  };
});

import { classifyReport } from "../../../lib/gemini";

describe("classifyReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse valid AI response correctly", async () => {
    const mockResponse = {
      category: "fire",
      urgency: "critical",
      summary: "Fire near a shop",
      suggestedAction: "Call fire service",
      confidence: 0.91,
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    });

    const result = await classifyReport("Fire near shop", "Sylhet", "bn");

    expect(result).toEqual(mockResponse);
  });

  it("should clamp confidence to max 1", async () => {
    const mockResponse = {
      category: "medical",
      urgency: "high",
      summary: "Medical emergency",
      suggestedAction: "Send ambulance",
      confidence: 1.5,
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    });

    const result = await classifyReport("Heart attack", "Dhaka", "en");

    expect(result.confidence).toBe(1);
  });

  it("should clamp confidence to min 0", async () => {
    const mockResponse = {
      category: "crime",
      urgency: "medium",
      summary: "Theft reported",
      suggestedAction: "Send police",
      confidence: -0.5,
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    });

    const result = await classifyReport("Someone stole my bag", "Chittagong", "en");

    expect(result.confidence).toBe(0);
  });

  it("should throw error when AI returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "This is not valid JSON at all" },
    });

    await expect(
      classifyReport("Some description", "Some location", "en"),
    ).rejects.toThrow("AI classification failed. Please try again.");
  });

  it("should throw error when AI returns markdown-wrapped JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "```json\n{\"category\": \"fire\"}\n```" },
    });

    await expect(
      classifyReport("Fire", "Dhaka", "bn"),
    ).rejects.toThrow("AI classification failed. Please try again.");
  });

  it("should handle AI API failure", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API rate limit exceeded"));

    await expect(
      classifyReport("Emergency", "Sylhet", "bn"),
    ).rejects.toThrow("API rate limit exceeded");
  });

  it("should extract only required fields from AI response", async () => {
    const mockResponse = {
      category: "flood",
      urgency: "high",
      summary: "Flooding in area",
      suggestedAction: "Evacuate residents",
      confidence: 0.88,
      extraField: "should be ignored",
      anotherField: 123,
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    });

    const result = await classifyReport("Water everywhere", "Sylhet", "bn");

    expect(result).toEqual({
      category: "flood",
      urgency: "high",
      summary: "Flooding in area",
      suggestedAction: "Evacuate residents",
      confidence: 0.88,
    });
    expect(result).not.toHaveProperty("extraField");
  });
});
