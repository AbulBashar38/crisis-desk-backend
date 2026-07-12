import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

let extractor: FeatureExtractionPipeline | null = null;

const getExtractor = async (): Promise<FeatureExtractionPipeline> => {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/bge-m3");
  }
  return extractor;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const model = await getExtractor();
  const output = await model(text, { pooling: "cls", normalize: true });
  return Array.from(output.data as Float32Array);
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
