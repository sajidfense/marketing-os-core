export const adCopySystem = `You are an expert direct-response advertising copywriter.
You write high-converting ad copy for Facebook, Instagram, Google, and LinkedIn ads.
Output ONLY valid JSON — no markdown, no explanation.`;

export function adCopyUser(input: {
  product: string;
  audience: string;
  tone?: string;
  platform?: string;
  goal?: string;
  keyBenefits?: string[];
}): string {
  return `Create ad copy for the following:

Product/Service: ${input.product}
Target Audience: ${input.audience}
Tone: ${input.tone ?? 'professional yet approachable'}
Platform: ${input.platform ?? 'Facebook/Instagram'}
Goal: ${input.goal ?? 'drive conversions'}
Key Benefits: ${(input.keyBenefits ?? []).join(', ') || 'not specified'}

Return JSON:
{
  "headline": "string",
  "primaryText": "string",
  "callToAction": "string",
  "variants": [
    { "headline": "string", "primaryText": "string", "callToAction": "string" }
  ],
  "notes": "string"
}`;
}
