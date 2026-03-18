import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

// ── Interfaces ──────────────────────────────────────────────────

/** Shape of a row in meta_ai_reports */
export interface AIReport {
  id: string;
  organization_id: string;
  title: string;
  report_type: string;
  date_range_start: string;
  date_range_end: string;
  narrative: string;
  highlights: Record<string, unknown>[];
  recommendations: string[];
  raw_data: Record<string, unknown>;
  generated_by: string;
  created_at: string;
}

/** Input for board report generation */
export interface GenerateBoardReportInput {
  date_range_start: string;
  date_range_end: string;
  title?: string;
  include_sections?: string[];
}

/** Input for PDF export */
export interface ExportPdfInput {
  report_id: string;
  template?: string;
}

// ── Generate board report (TODO) ────────────────────────────────
export async function generateBoardReport(req: Request, res: Response): Promise<void> {
  // TODO: Full implementation should:
  // 1. Parse & validate req.body as GenerateBoardReportInput
  // 2. Query meta_daily_snapshots for the given date range & org
  // 3. Aggregate key metrics (impressions, clicks, spend, conversions)
  // 4. Call AI service to generate a narrative summary with highlights
  //    and recommendations based on the aggregated data
  // 5. Save the generated report to meta_ai_reports
  // 6. Return the saved report

  res.status(501).json({ success: false, error: 'Not implemented yet' });
}

// ── Export PDF (TODO) ───────────────────────────────────────────
export async function exportPdf(req: Request, res: Response): Promise<void> {
  // TODO: Full implementation should:
  // 1. Accept report_id from req.body (ExportPdfInput)
  // 2. Fetch the report from meta_ai_reports by id and org_id
  // 3. Render the report narrative + data into an HTML template
  // 4. Convert the HTML to a PDF buffer (e.g., using puppeteer or
  //    @react-pdf/renderer)
  // 5. Set Content-Type to application/pdf and stream the buffer

  res.status(501).json({ success: false, error: 'Not implemented yet' });
}

// ── List reports ────────────────────────────────────────────────
export async function listReports(req: Request, res: Response): Promise<void> {
  const { organizationId } = req;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const { data, error } = await supabase
    .from('meta_ai_reports')
    .select('id, title, report_type, date_range_start, date_range_end, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    return;
  }

  res.json({ success: true, data });
}
