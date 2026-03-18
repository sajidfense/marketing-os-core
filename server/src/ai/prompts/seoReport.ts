export const seoReportSystem = `You are a senior SEO strategist producing comprehensive SEO reports for agencies and marketing teams.
Your reports are data-driven, actionable, and structured for executive presentation.
Output ONLY valid JSON — no markdown, no explanation.`;

export function seoReportUser(input: {
  url: string;
  keyword?: string;
  title?: string;
  metaDescription?: string;
  h1Tags?: string[];
  h2Tags?: string[];
  wordCount?: number;
  imageCount?: number;
  imagesWithoutAlt?: number;
  internalLinks?: number;
  externalLinks?: number;
  hasSchemaMarkup?: boolean;
  schemaTypes?: string[];
}): string {
  return `Generate a comprehensive SEO report for:

URL: ${input.url}
${input.keyword ? `Target Keyword: ${input.keyword}` : 'Target Keyword: Not specified (infer from page content)'}
Title: ${input.title ?? 'Not provided'}
Meta Description: ${input.metaDescription ?? 'Not provided'}
H1 Tags: ${(input.h1Tags ?? []).join(', ') || 'None'}
H2 Tags: ${(input.h2Tags ?? []).join(', ') || 'None'}
Word Count: ${input.wordCount ?? 'Unknown'}
Images: ${input.imageCount ?? 0} total, ${input.imagesWithoutAlt ?? 0} missing alt text
Internal Links: ${input.internalLinks ?? 0}
External Links: ${input.externalLinks ?? 0}
Schema: ${input.hasSchemaMarkup ? `Yes (${(input.schemaTypes ?? []).join(', ')})` : 'No'}

Return JSON:
{
  "summary": {
    "headline": "string (one-line verdict)",
    "overview": "string (3-4 sentence analysis)",
    "overallScore": number (0-100),
    "grade": "A" | "B" | "C" | "D" | "F"
  },
  "technicalIssues": [
    {
      "severity": "critical" | "warning" | "info",
      "title": "string",
      "description": "string",
      "fix": "string",
      "impact": "high" | "medium" | "low"
    }
  ],
  "contentGaps": [
    {
      "title": "string",
      "description": "string",
      "suggestedAction": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  "keywordOpportunities": [
    {
      "keyword": "string",
      "intent": "informational" | "transactional" | "navigational" | "commercial",
      "difficulty": "easy" | "medium" | "hard",
      "suggestedPage": "string",
      "action": "string"
    }
  ],
  "competitorSuggestions": [
    {
      "strategy": "string",
      "description": "string",
      "expectedImpact": "string"
    }
  ],
  "actionPlan": [
    {
      "priority": number (1-5),
      "task": "string",
      "category": "technical" | "on-page" | "content" | "off-page",
      "effort": "quick-win" | "moderate" | "significant",
      "impact": "string"
    }
  ]
}`;
}
