import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AI_MODEL = 'claude-opus-4-5';

// Cost per 1K tokens (USD) — update as pricing changes
const COST_PER_1K_INPUT  = 0.015;
const COST_PER_1K_OUTPUT = 0.075;

export interface AIResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number;
  model: string;
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<AIResponse> {
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n');

  const promptTokens     = response.usage.input_tokens;
  const completionTokens = response.usage.output_tokens;
  const totalTokens      = promptTokens + completionTokens;
  const costEstimate =
    (promptTokens / 1000) * COST_PER_1K_INPUT +
    (completionTokens / 1000) * COST_PER_1K_OUTPUT;

  return {
    content,
    promptTokens,
    completionTokens,
    totalTokens,
    costEstimate,
    model: AI_MODEL,
  };
}
