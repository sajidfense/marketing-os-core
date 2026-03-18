import { supabase } from '../lib/supabase';
import { callAI } from './ai.service';
import { logUsage } from './usage.service';

import { adCopySystem, adCopyUser }               from '../ai/prompts/adCopy';
import { landingPageSystem, landingPageUser }     from '../ai/prompts/landingPage';
import { emailSequenceSystem, emailSequenceUser } from '../ai/prompts/emailSequence';
import { funnelStrategySystem, funnelStrategyUser } from '../ai/prompts/funnelStrategy';
import { campaignStrategySystem, campaignStrategyUser } from '../ai/prompts/campaignStrategy';
import { videoScriptSystem, videoScriptUser }     from '../ai/prompts/videoScript';
import { socialCaptionSystem, socialCaptionUser } from '../ai/prompts/socialCaption';
import { blogPlannerSystem, blogPlannerUser }     from '../ai/prompts/blogPlanner';
import { seoAnalysisSystem, seoAnalysisUser }     from '../ai/prompts/seoAnalysis';
import { seoReportSystem, seoReportUser }         from '../ai/prompts/seoReport';

type SkillType = 'ad-copy' | 'landing-page' | 'email-sequence' | 'funnel-strategy' | 'campaign-strategy' | 'video-script' | 'social-caption' | 'blog-planner' | 'seo-analysis' | 'seo-report';

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
    case 'video-script':
      return { system: videoScriptSystem, user: videoScriptUser(input as Parameters<typeof videoScriptUser>[0]) };
    case 'social-caption':
      return { system: socialCaptionSystem, user: socialCaptionUser(input as Parameters<typeof socialCaptionUser>[0]) };
    case 'blog-planner':
      return { system: blogPlannerSystem, user: blogPlannerUser(input as Parameters<typeof blogPlannerUser>[0]) };
    case 'seo-analysis':
      return { system: seoAnalysisSystem, user: seoAnalysisUser(input as Parameters<typeof seoAnalysisUser>[0]) };
    case 'seo-report':
      return { system: seoReportSystem, user: seoReportUser(input as Parameters<typeof seoReportUser>[0]) };
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
