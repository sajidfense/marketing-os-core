import { Request, Response, NextFunction } from 'express';
import { checkCredits, consumeCredits } from '../services/credits.service';
import { getCreditCost } from '../config/credits';

/**
 * Middleware factory that checks and consumes credits for an AI skill.
 *
 * Usage:
 *   router.post('/analyze', creditsGuard('seo-analysis'), handler)
 *
 * For dynamic skill types (e.g. /skills/:skillType), pass no argument
 * and it reads from req.params.skillType.
 */
export function creditsGuard(fixedSkillType?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const skillType = fixedSkillType ?? req.params.skillType;

    if (!skillType) {
      res.status(400).json({ error: 'Skill type is required for credit check' });
      return;
    }

    const orgId = req.organizationId;
    if (!orgId) {
      res.status(401).json({ error: 'Organization context required' });
      return;
    }

    try {
      const { allowed, usage, cost } = await checkCredits(orgId, skillType);

      if (!allowed) {
        const remaining = Math.max(0, usage.credits_limit - usage.credits_used);
        res.status(402).json({
          error: 'Out of credits',
          code: 'CREDITS_EXHAUSTED',
          credits_used: usage.credits_used,
          credits_limit: usage.credits_limit,
          cost,
          remaining,
          reset_date: usage.reset_date,
        });
        return;
      }

      // Consume credits before executing the AI call
      await consumeCredits(orgId, skillType, req.userId);

      next();
    } catch (err) {
      console.error('[credits] Guard error:', err);
      res.status(500).json({ error: 'Credit check failed' });
    }
  };
}

/**
 * Returns credit cost info without consuming.
 * Useful for showing cost before user confirms.
 */
export function creditCostInfo(fixedSkillType?: string) {
  return (req: Request, res: Response): void => {
    const skillType = fixedSkillType ?? req.params.skillType;
    const cost = getCreditCost(skillType ?? '');
    res.json({ success: true, data: { skillType, cost } });
  };
}
