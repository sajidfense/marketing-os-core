import { Request, Response } from 'express';
import { z } from 'zod';
import { generateSkill, getGenerationHistory } from '../services/marketingSkills.service';

const VALID_SKILLS = ['ad-copy', 'landing-page', 'email-sequence', 'funnel-strategy', 'campaign-strategy', 'video-script', 'social-caption', 'blog-planner', 'seo-analysis', 'seo-report'];

const skillInputSchema = z.object({
  product: z.string().min(1).max(500).optional(),
  audience: z.string().min(1).max(500).optional(),
  tone: z.string().max(100).optional(),
  platform: z.string().max(100).optional(),
  goal: z.string().max(500).optional(),
  keyBenefits: z.array(z.string().max(200)).max(10).optional(),
  context: z.string().max(2000).optional(),
  style: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  brandVoice: z.string().max(500).optional(),
  budget: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  channels: z.array(z.string().max(100)).max(10).optional(),
  // AI content tools
  topic: z.string().max(500).optional(),
  niche: z.string().max(200).optional(),
  keywords: z.array(z.string().max(200)).max(20).optional(),
  // SEO tools
  url: z.string().max(2000).optional(),
  keyword: z.string().max(200).optional(),
  title: z.string().max(500).optional(),
  metaDescription: z.string().max(1000).optional(),
  h1Tags: z.array(z.string().max(500)).max(10).optional(),
  h2Tags: z.array(z.string().max(500)).max(30).optional(),
  wordCount: z.number().optional(),
  imageCount: z.number().optional(),
  imagesWithoutAlt: z.number().optional(),
  internalLinks: z.number().optional(),
  externalLinks: z.number().optional(),
  hasSchemaMarkup: z.boolean().optional(),
  schemaTypes: z.array(z.string().max(100)).max(20).optional(),
});

export async function handleGenerateSkill(req: Request, res: Response): Promise<void> {
  const { skillType } = req.params;

  if (!VALID_SKILLS.includes(skillType)) {
    res.status(400).json({ error: 'Invalid skill type', validSkills: VALID_SKILLS });
    return;
  }

  const validation = skillInputSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(422).json({ error: 'Validation failed', details: validation.error.flatten() });
    return;
  }

  const result = await generateSkill(skillType, validation.data, req.organizationId!, req.userId!);
  res.status(200).json({ success: true, data: result });
}

export async function handleGetHistory(req: Request, res: Response): Promise<void> {
  const { skillType } = req.query;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const history = await getGenerationHistory(req.organizationId!, skillType as string | undefined, limit);
  res.status(200).json({ success: true, data: history });
}
