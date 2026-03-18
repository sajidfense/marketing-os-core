export const socialCaptionSystem = `You are a social media strategist and copywriter.
You craft captions that drive engagement, shares, and conversions.
Output ONLY valid JSON — no markdown, no explanation.`;

export function socialCaptionUser(input: {
  platform?: string;
  topic: string;
  style?: string;
  brandVoice?: string;
  context?: string;
}): string {
  return `Create social media captions for:

Platform: ${input.platform ?? 'Instagram'}
Topic: ${input.topic}
Style: ${input.style ?? 'professional yet approachable'}
Brand Voice: ${input.brandVoice ?? 'modern and confident'}
${input.context ? `Additional context: ${input.context}` : ''}

Return JSON:
{
  "captions": [
    {
      "text": "string (the caption)",
      "style": "string (e.g. storytelling, educational, promotional)",
      "estimatedEngagement": "string (low/medium/high)"
    }
  ],
  "hashtags": ["string (relevant hashtags without #)"],
  "bestTimeToPost": "string",
  "tips": "string"
}`;
}
