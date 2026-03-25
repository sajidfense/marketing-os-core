import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { callAI } from '../services/ai.service';

// ── Validation ────────────────────────────────────────────────────

const generateSchema = z.object({
  period_start: z.string().min(1, 'Start date is required'),
  period_end:   z.string().min(1, 'End date is required'),
  title:        z.string().optional(),
});

// ── Generate board report ─────────────────────────────────────────

export async function generateBoardReport(req: Request, res: Response): Promise<void> {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { period_start, period_end, title } = parsed.data;
  const orgId = req.organizationId;

  // 1. Gather org data for the report context
  const [campaigns, leads, aiGens] = await Promise.all([
    supabase.from('campaigns').select('name, type, status, budget, goal')
      .eq('organization_id', orgId).limit(20),
    supabase.from('leads').select('name, company, stage, value')
      .eq('organization_id', orgId).limit(20),
    supabase.from('ai_generations').select('skill_type, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', period_start)
      .lte('created_at', period_end)
      .limit(50),
  ]);

  const [campaignCount, leadCount] = await Promise.all([
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  // Build data context for AI
  const dataContext = {
    period: { start: period_start, end: period_end },
    campaigns: {
      total: campaignCount.count ?? 0,
      samples: campaigns.data ?? [],
    },
    leads: {
      total: leadCount.count ?? 0,
      pipeline_value: (leads.data ?? []).reduce((sum, l) => sum + (Number(l.value) || 0), 0),
      by_stage: (leads.data ?? []).reduce((acc, l) => {
        acc[l.stage] = (acc[l.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    ai_usage: {
      total_generations: aiGens.data?.length ?? 0,
      by_skill: (aiGens.data ?? []).reduce((acc, g) => {
        acc[g.skill_type] = (acc[g.skill_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  };

  // 2. Create the report record in 'generating' status
  const reportTitle = title || `Board Report: ${period_start} to ${period_end}`;

  const { data: report, error: insertError } = await supabase
    .from('meta_ai_reports')
    .insert({
      organization_id: orgId,
      report_type: 'board_report',
      title: reportTitle,
      period_start,
      period_end,
      status: 'generating',
      generated_by: req.userId,
      kpi_data: dataContext,
    })
    .select('*')
    .single();

  if (insertError || !report) {
    res.status(500).json({ success: false, error: 'Failed to create report record' });
    return;
  }

  // Return immediately so the UI can show 'generating' status
  res.status(201).json({ success: true, data: report });

  // 3. Generate AI narrative in the background
  try {
    const systemPrompt = `You are a senior marketing strategist writing a board report.
Write in a professional, data-driven tone. Use the data provided to create insights.
Return a JSON object with this structure:
{
  "narrative": "A 3-5 paragraph executive summary...",
  "highlights": ["Key highlight 1", "Key highlight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}`;

    const userPrompt = `Generate a board report for the period ${period_start} to ${period_end}.

Here is the organization's data:
${JSON.stringify(dataContext, null, 2)}

Focus on:
- Campaign performance and status
- Lead pipeline health and value
- AI tool utilization
- Key recommendations for the next period`;

    const aiResult = await callAI(systemPrompt, userPrompt, 2048);

    let parsed: { narrative: string; highlights: string[]; recommendations: string[] };
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        narrative: aiResult.content,
        highlights: [],
        recommendations: [],
      };
    } catch {
      parsed = {
        narrative: aiResult.content,
        highlights: [],
        recommendations: [],
      };
    }

    // 4. Update the report with AI-generated content
    await supabase
      .from('meta_ai_reports')
      .update({
        ai_narrative: parsed.narrative,
        html_content: `<h2>Executive Summary</h2><p>${parsed.narrative.replace(/\n/g, '</p><p>')}</p>
          <h2>Key Highlights</h2><ul>${parsed.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
          <h2>Recommendations</h2><ul>${parsed.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`,
        status: 'completed',
      })
      .eq('id', report.id);

    console.log(`[reports] Board report ${report.id} completed for org ${orgId}`);
  } catch (err) {
    console.error(`[reports] AI generation failed for report ${report.id}:`, err);
    await supabase
      .from('meta_ai_reports')
      .update({ status: 'failed' })
      .eq('id', report.id);
  }
}

// ── Export PDF ─────────────────────────────────────────────────────

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const { report_id } = req.body;
  if (!report_id) {
    res.status(400).json({ success: false, error: 'report_id is required' });
    return;
  }

  const { data: report, error } = await supabase
    .from('meta_ai_reports')
    .select('*')
    .eq('id', report_id)
    .eq('organization_id', req.organizationId)
    .single();

  if (error || !report) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  if (report.status !== 'completed') {
    res.status(400).json({ success: false, error: 'Report is not yet completed' });
    return;
  }

  // Return the HTML content as downloadable HTML (PDF requires puppeteer which is heavy)
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#1a1a1a}
h1{color:#4f46e5}h2{color:#6366f1;margin-top:2rem}ul{padding-left:1.5rem}li{margin-bottom:0.5rem}
.meta{color:#6b7280;font-size:0.875rem;margin-bottom:2rem}</style></head>
<body><h1>${report.title}</h1>
<p class="meta">Period: ${report.period_start} to ${report.period_end} | Generated: ${new Date(report.created_at).toLocaleDateString()}</p>
${report.html_content || '<p>No content available.</p>'}
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.html"`);
  res.send(html);
}

// ── List reports ──────────────────────────────────────────────────

export async function listReports(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const { data, error } = await supabase
    .from('meta_ai_reports')
    .select('id, title, report_type, status, period_start, period_end, created_at')
    .eq('organization_id', req.organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    return;
  }

  res.json({ success: true, data });
}
