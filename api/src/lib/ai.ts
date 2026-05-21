import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type ModelTier = "fast" | "quality";

const ANTHROPIC_MODELS: Record<ModelTier, string> = {
  fast: "claude-3-5-haiku-20241022",
  quality: "claude-3-5-sonnet-20241022",
};

const OPENAI_MODELS: Record<ModelTier, string> = {
  fast: "gpt-4o-mini",
  quality: "gpt-4o",
};

function cleanJson(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

function getProvider(): "openai" | "anthropic" {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "openai" || explicit === "anthropic") return explicit;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  throw new Error(
    "No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in api/.env"
  );
}

export async function completeJson<T>(
  system: string,
  user: string,
  tier: ModelTier = "fast"
): Promise<T> {
  const provider = getProvider();
  const systemPrompt = `${system}\n\nRespond with valid JSON only. No markdown fences.`;

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: OPENAI_MODELS[tier],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    const text = response.choices[0]?.message?.content ?? "";
    return JSON.parse(cleanJson(text)) as T;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: ANTHROPIC_MODELS[tier],
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return JSON.parse(cleanJson(text)) as T;
}
