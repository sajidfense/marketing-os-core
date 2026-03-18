export const landingPageSystem = `You are a conversion-focused landing page strategist and copywriter.
You create compelling landing page content structures that drive action.
Output ONLY valid JSON — no markdown, no explanation.`;

export function landingPageUser(input: {
  product: string;
  audience: string;
  offer: string;
  painPoints?: string[];
  socialProof?: string;
}): string {
  return `Create a high-converting landing page structure for:

Product/Service: ${input.product}
Target Audience: ${input.audience}
Core Offer: ${input.offer}
Pain Points: ${(input.painPoints ?? []).join(', ') || 'not specified'}
Social Proof: ${input.socialProof ?? 'not specified'}

Return JSON:
{
  "heroHeadline": "string",
  "heroSubheadline": "string",
  "heroCtaText": "string",
  "problemSection": { "headline": "string", "body": "string" },
  "solutionSection": { "headline": "string", "body": "string" },
  "benefitsList": ["string"],
  "socialProofSection": { "headline": "string", "testimonialPrompts": ["string"] },
  "faqItems": [{ "question": "string", "answer": "string" }],
  "closingCta": { "headline": "string", "body": "string", "buttonText": "string" }
}`;
}
