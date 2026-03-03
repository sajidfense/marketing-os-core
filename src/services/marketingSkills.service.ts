import { supabase } from './supabase.client';
import { callAI } from './ai.service';
import { logUsage } from './usage.service';

import { adCopySystem, adCopyUser }               from '../ai/prompts/adCopy';
import { landingPageSystem, landingPageUser }     from '../ai/prompts/landingPage';
import { emailSequenceSystem, emailSequenceUser } from '../ai/prompts/emailSequence';
import { funnelStrategySystem, funnelStrategyUser } from '../ai/prompts/funnelStrategy';
import { campaignStrategySystem, campaignStrategyUser } from '../ai/prompts/campaignStrategy';

type SkillType = 'ad-copy' | 'landing-page' | 'email-sequence' | 'funnel-strategy' | 'campaign-strategy';

interface SkillResult {
  generationId: string;
  skillType: string;
  output: unknown;
  tokensUsed: number;
  costEstimate: number;
}

function resolvePrompt(skillType: SkillType, input: Record<string, unknown>) {
  switch (skillType) {
    case 'ad-copy':
      return { system: adCopySystem, user: adCopyUser(input as Parameters<typeof adCopyUser>[0]) };
    case 'landing-page':
      return { system: landingPageSystem, user: landingPageUser(input as Parameters<typeof landingPageUser>[0]) };
    case 'email-sequence':
      return { system: emailSequenceSystem, user: emailSequenceUser(input as Parameters<typeof emailSequenceUser>[0]) };
    case 'funnel-strategy':
      return { system: funnelStrategySystem, user: funnelStrategyUser(input as Parameters<typeof funnelStrategyUser>[0]) };
    case 'campaign-strategy':
      return { system: campaignStrategySystem, user: campaignStrategyUser(input as Parameters<typeof campaignStrategyUser>[0]) };
    default:
      throw new Error(`Unknown skill type: ${skillType}`);
  }
}

export async function generateSkill(
  skillType: string,
  input: Record<string, unknown>,
  orgId: string,
  userId: string
): Promise<SkillResult> {
  // 1. Resolve prompt templates
  const { system, user } = resolvePrompt(skillType as SkillType, input);

  // 2. Call AI
  const aiResponse = await callAI(system, user);

  // 3. Parse structured JSON output
  let output: unknown;
  try {
    output = JSON.parse(aiResponse.content);
  } catch {
    output = { raw: aiResponse.content };
  }

  // 4. Store generation in ai_generations
  const { data: generation, error } = await supabase
    .from('ai_generations')
    .insert({
      organization_id:    orgId,
      user_id:            userId,
      skill_type:         skillType,
      input_data:         input,
      output_data:        output as Record<string, unknown>,
      model:              aiResponse.model,
      prompt_tokens:      aiResponse.promptTokens,
      completion_tokens:  aiResponse.completionTokens,
      total_tokens:       aiResponse.totalTokens,
      cost_estimate:      aiResponse.costEstimate,
    })
    .select('id')
    .single();

  if (error) console.error('[marketingSkills.service] Failed to store generation:', error);

  // 5. Log usage
  await logUsage({
    organizationId: orgId,
    userId,
    skillType,
    tokensUsed:    aiResponse.totalTokens,
    costEstimate:  aiResponse.costEstimate,
  });

  return {
    generationId: generation?.id ?? 'unknown',
    skillType,
    output,
    tokensUsed:   aiResponse.totalTokens,
    costEstimate: aiResponse.costEstimate,
  };
}

export async function getGenerationHistory(
  orgId: string,
  skillType?: string,
  limit = 20
) {
  let query = supabase
    .from('ai_generations')
    .select('id, skill_type, input_data, output_data, total_tokens, cost_estimate, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (skillType) query = query.eq('skill_type', skillType);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
