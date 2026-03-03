export const campaignStrategySystem = `You are a senior marketing strategist with expertise in multi-channel campaigns.
You create data-driven, actionable campaign strategies.
Output ONLY valid JSON — no markdown, no explanation.`;

export function campaignStrategyUser(input: {
  product: string;
  audience: string;
  budget?: number;
  duration?: string;
  channels?: string[];
  competitors?: string[];
  goal?: string;
}): string {
  return `Create a comprehensive marketing campaign strategy for:

Product/Service: ${input.product}
Target Audience: ${input.audience}
Budget: ${input.budget ? '$' + input.budget : 'flexible'}
Duration: ${input.duration ?? '90 days'}
Channels: ${(input.channels ?? []).join(', ') || 'all relevant channels'}
Competitors: ${(input.competitors ?? []).join(', ') || 'not specified'}
Primary Goal: ${input.goal ?? 'brand awareness and lead generation'}

Return JSON:
{
  "campaignName": "string",
  "executiveSummary": "string",
  "targetPersona": { "name": "string", "demographics": "string", "psychographics": "string", "painPoints": ["string"] },
  "channels": [
    {
      "channel": "string",
      "budgetAllocation": "string",
      "tactics": ["string"],
      "contentTypes": ["string"],
      "kpis": ["string"]
    }
  ],
  "contentCalendar": [
    { "week": 1, "theme": "string", "deliverables": ["string"] }
  ],
  "successMetrics": { "primaryKPI": "string", "secondaryKPIs": ["string"], "targets": {} },
  "timeline": [{ "phase": "string", "duration": "string", "milestones": ["string"] }],
  "budget": { "total": "string", "breakdown": {} },
  "riskMitigation": ["string"]
}`;
}
