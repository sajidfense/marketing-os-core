import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateSkill, getGenerationHistory } from '../services/marketingSkills.service';

const VALID_SKILLS = ['ad-copy', 'landing-page', 'email-sequence', 'funnel-strategy', 'campaign-strategy'];

const skillInputSchema = z.object({
  product: z.string().min(1).optional(),
  audience: z.string().min(1).optional(),
}).passthrough();

export async function handleGenerateSkill(req: Request, res: Response): Promise<void> {
  const { skillType } = req.params;
  const authReq = req as AuthenticatedRequest;

  if (!VALID_SKILLS.includes(skillType)) {
    res.status(400).json({ error: 'Invalid skill type', validSkills: VALID_SKILLS });
    return;
  }

  const validation = skillInputSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(422).json({ error: 'Validation failed', details: validation.error.flatten() });
    return;
  }

  const result = await generateSkill(skillType, req.body, authReq.organizationId, authReq.userId);
  res.status(200).json({ success: true, data: result });
}

export async function handleGetHistory(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const { skillType } = req.query;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const history = await getGenerationHistory(authReq.organizationId, skillType as string | undefined, limit);
  res.status(200).json({ success: true, data: history });
}
