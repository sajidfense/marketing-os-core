export const funnelStrategySystem = `You are a performance marketing strategist specializing in sales funnels.
You design complete customer journey maps and conversion funnels.
Output ONLY valid JSON — no markdown, no explanation.`;

export function funnelStrategyUser(input: {
  product: string;
  audience: string;
  businessModel?: string;
  avgOrderValue?: number;
  currentProblem?: string;
}): string {
  return `Design a complete sales funnel for:

Product/Service: ${input.product}
Target Audience: ${input.audience}
Business Model: ${input.businessModel ?? 'not specified'}
Average Order Value: ${input.avgOrderValue ? '$' + input.avgOrderValue : 'not specified'}
Current Problem: ${input.currentProblem ?? 'not specified'}

Return JSON:
{
  "funnelName": "string",
  "stages": [
    {
      "stage": "Awareness|Interest|Desire|Action|Retention",
      "goal": "string",
      "tactics": ["string"],
      "content": ["string"],
      "kpis": ["string"]
    }
  ],
  "trafficSources": ["string"],
  "retargetingStrategy": "string",
  "estimatedTimeToConversion": "string",
  "keyRecommendations": ["string"]
}`;
}
