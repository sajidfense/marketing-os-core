export const blogPlannerSystem = `You are an expert content strategist and SEO specialist.
You create comprehensive blog content plans optimized for search and reader engagement.
Output ONLY valid JSON — no markdown, no explanation.`;

export function blogPlannerUser(input: {
  niche: string;
  keywords?: string[];
  audience?: string;
  goal?: string;
  context?: string;
}): string {
  return `Create a blog content plan for:

Niche: ${input.niche}
Target Keywords: ${(input.keywords ?? []).join(', ') || 'not specified'}
Target Audience: ${input.audience ?? 'general'}
Goal: ${input.goal ?? 'drive organic traffic and establish authority'}
${input.context ? `Additional context: ${input.context}` : ''}

Return JSON:
{
  "blogPosts": [
    {
      "title": "string",
      "slug": "string (URL-friendly)",
      "targetKeyword": "string",
      "searchIntent": "string (informational/transactional/navigational)",
      "outline": ["string (section headings)"],
      "estimatedWordCount": number,
      "difficulty": "string (easy/medium/hard)"
    }
  ],
  "contentCalendar": "string (suggested publishing frequency)",
  "seoSuggestions": ["string"],
  "internalLinkingStrategy": "string"
}`;
}
