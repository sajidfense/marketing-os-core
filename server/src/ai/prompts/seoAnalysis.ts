export const seoAnalysisSystem = `You are an expert SEO analyst. You perform comprehensive on-page SEO audits.
You return structured, actionable analysis with a numerical score.
Output ONLY valid JSON — no markdown, no explanation.`;

export function seoAnalysisUser(input: {
  url: string;
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
  keyword?: string;
}): string {
  return `Perform an SEO analysis for this webpage:

URL: ${input.url}
Title: ${input.title ?? 'Not provided'}
Meta Description: ${input.metaDescription ?? 'Not provided'}
H1 Tags: ${(input.h1Tags ?? []).join(', ') || 'None found'}
H2 Tags: ${(input.h2Tags ?? []).join(', ') || 'None found'}
Word Count: ${input.wordCount ?? 'Unknown'}
Total Images: ${input.imageCount ?? 0}
Images Without Alt: ${input.imagesWithoutAlt ?? 0}
Internal Links: ${input.internalLinks ?? 0}
External Links: ${input.externalLinks ?? 0}
Schema Markup: ${input.hasSchemaMarkup ? 'Yes' : 'No'}
${input.keyword ? `Target Keyword: ${input.keyword}` : ''}

Return JSON:
{
  "score": number (0-100, overall SEO health),
  "grade": "A" | "B" | "C" | "D" | "F",
  "summary": "string (2-3 sentence executive summary)",
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "category": "technical" | "on-page" | "content" | "off-page",
      "title": "string",
      "description": "string",
      "fix": "string (specific actionable fix)"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "title": "string",
      "description": "string",
      "impact": "string (expected improvement)",
      "effort": "string (quick-win | moderate | significant)"
    }
  ],
  "breakdown": {
    "titleTag": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "metaDescription": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "headings": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "content": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "images": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "links": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" },
    "schema": { "score": number, "status": "good" | "warning" | "critical", "detail": "string" }
  }
}`;
}
