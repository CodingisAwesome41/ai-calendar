import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ModelTier = "fast" | "quality";

const MODELS: Record<ModelTier, string> = {
  fast: "claude-3-5-haiku-20241022",
  quality: "claude-3-5-sonnet-20241022",
};

export async function completeJson<T>(
  system: string,
  user: string,
  tier: ModelTier = "fast"
): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await client.messages.create({
    model: MODELS[tier],
    max_tokens: 2048,
    system: `${system}\n\nRespond with valid JSON only. No markdown fences.`,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
