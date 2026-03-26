import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Circle,
  BarChart3,
  Globe,
  Shield,
  Link2,
  Bot,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

// ── Types ──────────────────────────────────────────────────────

interface Snapshot {
  id: string;
  domain: string;
  snapshot_date: string;
  category: 'primary' | 'competitor';
  performance_score: number | null;
  lcp_ms: number | null;
  tbt_ms: number | null;
  organic_traffic: number | null;
  keyword_count: number | null;
  domain_authority: number | null;
  backlinks_total: number | null;
  paid_traffic: number | null;
  ai_visibility: number | null;
  recommendations: Recommendation[];
  metadata: Record<string, unknown>;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium';
  category: string;
  completed: boolean;
}

interface CompetitorDomain {
  id: string;
  domain: string;
  label: string;
  is_primary: boolean;
}

// ── Helpers ────────────────────────────────────────────────────

function fmt(n: number | null | undefined, suffix = ''): string {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K${suffix}`;
  return `${n}${suffix}`;
}

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

// ── SVG Bar Chart ──────────────────────────────────────────────

function BarChart({
  data,
  height = 200,
  barWidth = 48,
  maxVal,
  formatLabel,
}: {
  data: { label: string; value: number; color: string; sublabel?: string }[];
  height?: number;
  barWidth?: number;
  maxVal?: number;
  formatLabel?: (v: number) => string;
}) {
  const max = maxVal ?? Math.max(...data.map((d) => d.value), 1) * 1.15;
  const gap = 24;
  const leftPad = 40;
  const bottomPad = 50;
  const chartH = height - bottomPad;
  const totalW = leftPad + data.length * (barWidth + gap);
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis grid */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = chartH - (chartH / gridLines) * i;
        const val = (max / gridLines) * i;
        return (
          <g key={i}>
            <line x1={leftPad} y1={y} x2={totalW} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={leftPad - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={9}>
              {formatLabel ? formatLabel(val) : Math.round(val)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = leftPad + i * (barWidth + gap) + gap / 2;
        const barH = max > 0 ? (d.value / max) * chartH : 0;
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={d.color} className="transition-all duration-300" />
            <text x={x + barWidth / 2} y={chartH + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
              {d.label}
            </text>
            {d.sublabel && (
              <text x={x + barWidth / 2} y={chartH + 28} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>
                {d.sublabel}
              </text>
            )}
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-foreground" fontSize={10} fontWeight={600}>
              {formatLabel ? formatLabel(d.value) : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Grouped Bar Chart ──────────────────────────────────────────

function GroupedBarChart({
  groups,
  height = 220,
  legend,
}: {
  groups: { label: string; bars: { value: number; color: string }[] }[];
  height?: number;
  legend: { label: string; color: string }[];
}) {
  const allVals = groups.flatMap((g) => g.bars.map((b) => b.value));
  const max = Math.max(...allVals, 1) * 1.15;
  const barW = 20;
  const groupGap = 36;
  const barGap = 4;
  const leftPad = 40;
  const bottomPad = 60;
  const chartH = height - bottomPad;
  const barsPerGroup = groups[0]?.bars.length ?? 1;
  const groupW = barsPerGroup * barW + (barsPerGroup - 1) * barGap;
  const totalW = leftPad + groups.length * (groupW + groupGap);
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${totalW} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = chartH - (chartH / gridLines) * i;
        const val = (max / gridLines) * i;
        return (
          <g key={i}>
            <line x1={leftPad} y1={y} x2={totalW} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={leftPad - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={9}>{Math.round(val)}</text>
          </g>
        );
      })}
      {groups.map((g, gi) => {
        const gx = leftPad + gi * (groupW + groupGap) + groupGap / 2;
        return (
          <g key={gi}>
            {g.bars.map((b, bi) => {
              const x = gx + bi * (barW + barGap);
              const barH = max > 0 ? (b.value / max) * chartH : 0;
              return <rect key={bi} x={x} y={chartH - barH} width={barW} height={barH} rx={3} fill={b.color} />;
            })}
            <text x={gx + groupW / 2} y={chartH + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>{g.label}</text>
          </g>
        );
      })}
      {/* Legend */}
      {legend.map((l, i) => (
        <g key={i} transform={`translate(${leftPad + i * 120}, ${height - 12})`}>
          <rect width={10} height={10} rx={2} fill={l.color} />
          <text x={14} y={9} className="fill-muted-foreground" fontSize={9}>{l.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Score Gauge ────────────────────────────────────────────────

function ScoreGauge({ score, label, size = 56 }: { score: number; label: string; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth={3} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Insight Card ───────────────────────────────────────────────

function InsightCard({ color, title, description }: { color: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Performance Page
// ══════════════════════════════════════════════════════════════

const TABS = ['Performance', 'SEO Metrics', 'Recommendations'] as const;
type Tab = (typeof TABS)[number];

const DOMAIN_COLORS: Record<string, string> = {
  'financeone.com.au': '#a78bfa',
  'nowfinance.com.au': '#60a5fa',
  'moneyme.com.au': '#c084fc',
  'plenti.com.au': '#facc15',
};

export default function Performance() {
  const [tab, setTab] = useState<Tab>('Performance');
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorDomain[]>([]);
  const [primarySnap, setPrimarySnap] = useState<Snapshot | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [snapRes, compRes] = await Promise.all([
        api.get<ApiResponse<Snapshot[]>>('/performance'),
        api.get<ApiResponse<CompetitorDomain[]>>('/competitor-domains'),
      ]);
      if (snapRes.success && snapRes.data) {
        setSnapshots(snapRes.data);
        const primary = snapRes.data.find((s) => s.category === 'primary');
        setPrimarySnap(primary ?? null);
      }
      if (compRes.success && compRes.data) setCompetitors(compRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group snapshots by domain
  const byDomain = useMemo(() => {
    const map: Record<string, Snapshot> = {};
    for (const s of snapshots) map[s.domain] = s;
    return map;
  }, [snapshots]);

  const domainOrder = useMemo(() => {
    const primary = competitors.find((c) => c.is_primary);
    const others = competitors.filter((c) => !c.is_primary);
    return [primary, ...others].filter(Boolean) as CompetitorDomain[];
  }, [competitors]);

  // Recommendation toggle
  async function toggleRec(recId: string) {
    if (!primarySnap) return;
    const updated = primarySnap.recommendations.map((r) =>
      r.id === recId ? { ...r, completed: !r.completed } : r,
    );
    try {
      await api.patch(`/performance/${primarySnap.id}`, { recommendations: updated });
      setPrimarySnap({ ...primarySnap, recommendations: updated });
      setSnapshots((prev) => prev.map((s) => s.id === primarySnap.id ? { ...s, recommendations: updated } : s));
    } catch {
      toast.error('Failed to update');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const recs = primarySnap?.recommendations ?? [];
  const completedCount = recs.filter((r) => r.completed).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Performance & SEO"
        description={`Last updated: ${primarySnap?.snapshot_date ? new Date(primarySnap.snapshot_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}`}
      />

      {/* ── Top metric cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: Zap, label: 'Performance Score', value: String(primarySnap?.performance_score ?? '—'), color: (primarySnap?.performance_score ?? 0) >= 80 ? '#22c55e' : (primarySnap?.performance_score ?? 0) >= 50 ? '#f59e0b' : '#ef4444' },
          { icon: TrendingUp, label: 'Organic Traffic', value: fmt(primarySnap?.organic_traffic), color: '#a78bfa' },
          { icon: Search, label: 'Organic Keywords', value: fmt(primarySnap?.keyword_count), color: '#60a5fa' },
          { icon: AlertCircle, label: 'LCP (Mobile)', value: fmtMs(primarySnap?.lcp_ms), color: (primarySnap?.lcp_ms ?? 0) <= 2500 ? '#22c55e' : '#ef4444' },
        ].map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <m.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Tab bar ──────────────────────────────────────── */}
      <div className="flex rounded-lg bg-muted p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('rounded-md px-4 py-2 text-xs font-medium transition-colors', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  PERFORMANCE TAB                                  */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === 'Performance' && (
        <div className="space-y-6">
          {/* Performance Scores */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-1">Performance Scores</h3>
              <p className="text-[11px] text-muted-foreground mb-4">PageSpeed Insights scores across competitors</p>
              <BarChart
                data={domainOrder.map((c) => ({
                  label: c.label ?? c.domain.split('.')[0],
                  sublabel: c.is_primary ? '(M)' : '(D)',
                  value: byDomain[c.domain]?.performance_score ?? 0,
                  color: DOMAIN_COLORS[c.domain] ?? '#888',
                }))}
                maxVal={100}
              />
            </CardContent>
          </Card>

          {/* Critical Issue Alert */}
          {primarySnap && (primarySnap.lcp_ms ?? 0) > 2500 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-500">Critical Issue</p>
                <p className="text-[11px] text-muted-foreground">
                  {competitors.find((c) => c.is_primary)?.label}'s mobile LCP ({fmtMs(primarySnap.lcp_ms)}) far exceeds the recommended 2.5s threshold
                </p>
              </div>
            </div>
          )}

          {/* LCP + TBT side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-1">Largest Contentful Paint (LCP)</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Lower is better (target: &lt;2.5s)</p>
                <BarChart
                  data={domainOrder.map((c) => ({
                    label: c.label ?? c.domain.split('.')[0],
                    value: (byDomain[c.domain]?.lcp_ms ?? 0) / 1000,
                    color: (byDomain[c.domain]?.lcp_ms ?? 0) > 2500 ? '#ef4444' : '#22c55e',
                  }))}
                  formatLabel={(v) => `${v.toFixed(1)}s`}
                  height={180}
                  barWidth={44}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-1">Total Blocking Time (TBT)</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Lower is better (target: &lt;200ms)</p>
                <BarChart
                  data={domainOrder.map((c) => ({
                    label: c.label ?? c.domain.split('.')[0],
                    value: byDomain[c.domain]?.tbt_ms ?? 0,
                    color: (byDomain[c.domain]?.tbt_ms ?? 0) > 200 ? '#f59e0b' : '#22c55e',
                  }))}
                  formatLabel={(v) => `${Math.round(v)}ms`}
                  height={180}
                  barWidth={44}
                />
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-3">Performance Insights</h3>
              <div className="divide-y divide-border/30">
                <InsightCard color="#f59e0b" title="Mobile LCP Crisis"
                  description={`${competitors.find((c) => c.is_primary)?.label}'s ${fmtMs(primarySnap?.lcp_ms)} LCP on mobile is 5.4x slower than competitors, likely due to unoptimized images or slow server response times.`} />
                <InsightCard color="#a78bfa" title="JavaScript Execution"
                  description={`MoneyMe's 1,030ms TBT suggests heavy JavaScript execution. ${competitors.find((c) => c.is_primary)?.label}'s ${fmtMs(primarySnap?.tbt_ms)} is better but still above the 200ms ideal.`} />
                <InsightCard color="#22c55e" title="NOW Finance Leads"
                  description={`NOW Finance achieves a 90 performance score with excellent LCP (1.1s) and low TBT (170ms), setting the benchmark.`} />
              </div>
            </CardContent>
          </Card>

          {/* Competitive Positioning Matrix */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-1">Competitive Positioning Matrix</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Side-by-side comparison of key metrics</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Metric</th>
                      {domainOrder.map((c) => (
                        <th key={c.domain} className="text-center py-2 px-3 font-medium" style={{ color: DOMAIN_COLORS[c.domain] }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {([
                      { label: 'Performance Score', key: 'performance_score', fmt: (v: number) => String(v) },
                      { label: 'Authority Score', key: 'domain_authority', fmt: (v: number) => String(v) },
                      { label: 'Organic Traffic (K)', key: 'organic_traffic', fmt: (v: number) => `${(v / 1000).toFixed(1)}K` },
                      { label: 'Paid Traffic (K)', key: 'paid_traffic', fmt: (v: number) => v > 0 ? `${(v / 1000).toFixed(1)}K` : '0K' },
                      { label: 'Backlinks (K)', key: 'backlinks_total', fmt: (v: number) => `${(v / 1000).toFixed(1)}K` },
                      { label: 'AI Visibility', key: 'ai_visibility', fmt: (v: number) => String(v) },
                    ] as { label: string; key: keyof Snapshot; fmt: (v: number) => string }[]).map((row) => (
                      <tr key={row.key}>
                        <td className="py-2.5 pr-4 text-muted-foreground">{row.label}</td>
                        {domainOrder.map((c) => {
                          const snap = byDomain[c.domain];
                          const val = snap ? (snap[row.key] as number | null) : null;
                          return (
                            <td key={c.domain} className="text-center py-2.5 px-3">
                              {val != null ? (
                                <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-semibold text-[11px]"
                                  style={{ backgroundColor: `${DOMAIN_COLORS[c.domain]}20`, color: DOMAIN_COLORS[c.domain] }}>
                                  {row.fmt(val)}
                                </span>
                              ) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-6 lg:grid-cols-2">
            {domainOrder.map((c) => {
              const s = byDomain[c.domain];
              if (!s) return null;
              const strengths: string[] = [];
              const weaknesses: string[] = [];

              if (c.is_primary) {
                if ((s.keyword_count ?? 0) > 5000) strengths.push(`Strong organic keywords (${fmt(s.keyword_count)})`);
                if ((s.organic_traffic ?? 0) > 10000) strengths.push('Good organic reach');
                if ((s.ai_visibility ?? 0) > 25) strengths.push('Competitive AI visibility');
                if ((s.lcp_ms ?? 0) > 2500) weaknesses.push(`Critical mobile LCP (${fmtMs(s.lcp_ms)})`);
                if ((s.domain_authority ?? 0) < 30) weaknesses.push('Low authority score');
                if ((s.paid_traffic ?? 0) < 1000) weaknesses.push('Minimal paid presence');
              } else {
                if ((s.performance_score ?? 0) >= 80) strengths.push('Excellent performance score');
                if ((s.paid_traffic ?? 0) > 10000) strengths.push('Strong paid strategy');
                if ((s.domain_authority ?? 0) >= 40) strengths.push('Highest authority score');
                if ((s.organic_traffic ?? 0) > 40000) strengths.push('Strong organic traffic');
                if ((s.backlinks_total ?? 0) > 20000) strengths.push('Massive backlink profile');
                if ((s.ai_visibility ?? 0) > 45) strengths.push('Best AI visibility');
                if ((s.tbt_ms ?? 0) > 500) weaknesses.push(`High TBT (${fmtMs(s.tbt_ms)})`);
                if ((s.paid_traffic ?? 0) === 0) weaknesses.push('No paid search presence');
                if ((s.keyword_count ?? 0) < 5000 && s.keyword_count) weaknesses.push(`Fewer organic keywords (${fmt(s.keyword_count)})`);
              }

              return (
                <Card key={c.domain}>
                  <CardContent className="p-5">
                    <h4 className="text-sm font-semibold mb-3" style={{ color: DOMAIN_COLORS[c.domain] }}>{c.label}</h4>
                    <div className="space-y-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-500">Strengths</p>
                      <div className="flex flex-wrap gap-1.5">
                        {strengths.map((st) => (
                          <span key={st} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
                            <CheckCircle2 className="h-2.5 w-2.5" />{st}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-red-400 mt-2">Weaknesses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {weaknesses.map((w) => (
                          <span key={w} className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                            <AlertCircle className="h-2.5 w-2.5" />{w}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Strategic Positioning */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-emerald-500 mb-2">Finance One's Opportunity</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Fix mobile performance and build backlinks to compete with NOW Finance's balanced approach. With {fmt(primarySnap?.keyword_count)} keywords, there's room to expand organic reach to 30K+ like Plenti.
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-amber-500 mb-2">Competitive Gap</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  MoneyMe and Plenti dominate through content scale ({fmt(byDomain['moneyme.com.au']?.keyword_count ?? byDomain['moneyme.com.au']?.organic_traffic)} keywords) and link building ({fmt(byDomain['plenti.com.au']?.backlinks_total)} backlinks). Finance One's challenge is to match their investment in these areas.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">Data sourced from Google PageSpeed Insights and SEMrush Domain Overview</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  SEO METRICS TAB                                  */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === 'SEO Metrics' && (
        <div className="space-y-6">
          {/* Organic Reach - grouped bars */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-1">Organic Reach</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Monthly organic traffic and keyword coverage</p>
              <GroupedBarChart
                groups={domainOrder.map((c) => ({
                  label: c.label ?? c.domain,
                  bars: [
                    { value: (byDomain[c.domain]?.organic_traffic ?? 0) / 1000, color: '#c084fc' },
                    { value: (byDomain[c.domain]?.keyword_count ?? byDomain[c.domain]?.organic_traffic ?? 0) / 1000, color: '#60a5fa' },
                  ],
                }))}
                legend={[{ label: 'Traffic (K)', color: '#c084fc' }, { label: 'Keywords (K)', color: '#60a5fa' }]}
              />
            </CardContent>
          </Card>

          {/* Authority + Backlinks side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-1">Authority Score</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Domain authority and backlink strength</p>
                <BarChart
                  data={domainOrder.map((c) => ({
                    label: c.label ?? c.domain,
                    value: byDomain[c.domain]?.domain_authority ?? 0,
                    color: '#2dd4bf',
                  }))}
                  maxVal={50}
                  height={180}
                  barWidth={44}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-1">Backlink Profile</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Total referring backlinks (K)</p>
                <BarChart
                  data={domainOrder.map((c) => ({
                    label: c.label ?? c.domain,
                    value: (byDomain[c.domain]?.backlinks_total ?? 0) / 1000,
                    color: (byDomain[c.domain]?.backlinks_total ?? 0) > 15000 ? '#facc15' : '#2dd4bf',
                  }))}
                  formatLabel={(v) => `${v.toFixed(1)}K`}
                  height={180}
                  barWidth={44}
                />
              </CardContent>
            </Card>
          </div>

          {/* AI Visibility */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-1">AI Search Visibility</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Positioning in AI-generated search results</p>
              <BarChart
                data={domainOrder.map((c) => ({
                  label: c.label ?? c.domain,
                  value: byDomain[c.domain]?.ai_visibility ?? 0,
                  color: '#c084fc',
                }))}
                maxVal={60}
              />
            </CardContent>
          </Card>

          {/* SEO Insights */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-3">SEO Insights</h3>
              <div className="divide-y divide-border/30">
                <InsightCard color="#60a5fa" title="Market Dominance: MoneyMe"
                  description="MoneyMe leads with 66.4K organic traffic and 17.5K keywords, 5x Finance One's reach. Their 30.5K backlinks show strong link-building investment." />
                <InsightCard color="#ef4444" title="Finance One's Strength"
                  description="Despite lower authority (28 vs 39-42), Finance One punches above its weight with 13.8K organic traffic and 6.8K keywords, suggesting strong content relevance." />
                <InsightCard color="#22c55e" title="Backlink Gap"
                  description="Finance One (4.8K) lags significantly behind MoneyMe (30.5K) and Plenti (19.6K). Link-building should be a priority to improve authority." />
                <InsightCard color="#f59e0b" title="AI Search Opportunity"
                  description="Finance One's AI Visibility (29) is competitive, but Plenti (51) shows the potential upside. Investing in authoritative content can improve AI positioning." />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/*  RECOMMENDATIONS TAB                              */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === 'Recommendations' && (
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-1">Optimization Progress</h3>
              <p className="text-[11px] text-muted-foreground mb-4">Track implementation of strategic recommendations</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Overall Completion</span>
                <span className={cn('text-xl font-bold tabular-nums', completedCount > 0 ? 'text-emerald-500' : 'text-muted-foreground')}>
                  {recs.length > 0 ? Math.round((completedCount / recs.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${recs.length > 0 ? (completedCount / recs.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{completedCount} of {recs.length} tasks completed</p>
            </CardContent>
          </Card>

          {/* Grouped by priority */}
          {(['critical', 'high', 'medium'] as const).map((priority) => {
            const items = recs.filter((r) => r.priority === priority);
            if (items.length === 0) return null;
            const color = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#f59e0b';
            const icon = priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : '🟡';
            const desc = priority === 'critical' ? 'Must be completed immediately to avoid search ranking penalties' : priority === 'high' ? 'Should be completed within 1-2 months for competitive advantage' : 'Long-term initiatives for sustained growth';

            // Group by category
            const byCategory: Record<string, Recommendation[]> = {};
            for (const r of items) {
              const cat = r.category || 'General';
              if (!byCategory[cat]) byCategory[cat] = [];
              byCategory[cat].push(r);
            }

            return (
              <Card key={priority}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{icon}</span>
                    <h3 className="text-sm font-semibold capitalize">{priority} Priority</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-5">{desc}</p>

                  {Object.entries(byCategory).map(([cat, catItems]) => {
                    const catCompleted = catItems.filter((r) => r.completed).length;
                    const CatIcon: LucideIcon = cat === 'Performance' ? Zap : cat === 'SEO' ? Search : Globe;
                    return (
                      <div key={cat} className="mb-5 last:mb-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold">{cat === 'Performance' ? 'Performance Issues' : cat === 'SEO' ? 'SEO Improvements' : 'Strategic Initiatives'}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{catCompleted}/{catItems.length}</span>
                        </div>
                        <div className="space-y-2 ml-6">
                          {catItems.map((rec) => (
                            <div key={rec.id}
                              className="flex items-start gap-3 py-2 cursor-pointer group"
                              onClick={() => toggleRec(rec.id)}>
                              {rec.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs font-semibold', rec.completed && 'line-through text-muted-foreground')}>{rec.title}</span>
                                  <Badge variant="outline" className="text-[8px]">{rec.category}</Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{rec.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Recommended Timeline</h3>
              <div className="space-y-4">
                {[
                  { period: 'Weeks 1-2: Emergency Performance Fix', detail: 'Focus on mobile LCP optimization and JavaScript reduction. These changes should yield immediate PageSpeed Insights improvements.' },
                  { period: 'Weeks 3-4: SEO Foundation', detail: 'Launch backlink strategy and begin keyword expansion. Start planning paid search campaign.' },
                  { period: 'Months 2-3: Growth Phase', detail: 'Execute paid search campaigns, publish AI-optimized content, and monitor metrics for continuous improvement.' },
                ].map((t) => (
                  <div key={t.period} className="flex gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">{t.period}</p>
                      <p className="text-[11px] text-muted-foreground">{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-[10px] text-center text-muted-foreground">Data sourced from Google PageSpeed Insights and SEMrush Domain Overview</p>
        </div>
      )}
    </div>
  );
}
