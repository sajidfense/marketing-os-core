export const emailSequenceSystem = `You are an expert email marketing strategist specializing in automated sequences.
You write emails that build trust, provide value, and drive conversions.
Output ONLY valid JSON — no markdown, no explanation.`;

export function emailSequenceUser(input: {
  product: string;
  audience: string;
  sequenceGoal: string;
  emailCount?: number;
  tone?: string;
}): string {
  const count = input.emailCount ?? 5;
  return `Create a ${count}-email sequence for:

Product/Service: ${input.product}
Target Audience: ${input.audience}
Sequence Goal: ${input.sequenceGoal}
Tone: ${input.tone ?? 'warm and professional'}

Return JSON:
{
  "sequenceName": "string",
  "emails": [
    {
      "emailNumber": 1,
      "sendDelay": "immediately",
      "subject": "string",
      "previewText": "string",
      "body": "string",
      "ctaText": "string",
      "ctaUrl": "{{CTA_URL}}"
    }
  ]
}`;
}
