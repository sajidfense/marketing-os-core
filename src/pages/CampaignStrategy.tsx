import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Calendar,
  DollarSign,
  BarChart3,
  TrendingUp,
  ChevronDown,
  Globe,
  Users,
  Sparkles,
  Loader2,
  LayoutList,
  GanttChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

interface Milestone {
  date: string;
  label: string;
}

interface StrategyMetadata {
  category?: string;
  start_date?: string | null;
  end_date?: string | null;
  milestones?: Milestone[];
  source?: string;
}

interface Strategy {
  id: string;
  name: string;
  objective: string;
  status: 'active' | 'planning' | 'completed' | 'paused';
  channels: string[];
  budget: number;
  timeframe: string;
  kpis: { label: string; target: string; current: string }[];
  audiences: string[];
  metadata: StrategyMetadata;
}

interface ApiStrategy {
  id: string;
  organization_id: string;
  name: string;
  objective: string;
  status: 'active' | 'planning' | 'completed' | 'paused';
  channels: string[] | null;
  budget: number | null;
  timeframe: string;
  kpis: { label: string; target: string; current: string }[] | null;
  audiences: string[] | null;
  metadata: StrategyMetadata | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const statusVariant: Record<string, 'success' | 'default' | 'secondary' | 'warning'> = {
  active: 'success',
  planning: 'default',
  completed: 'secondary',
  paused: 'warning',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function mapApiStrategy(s: ApiStrategy): Strategy {
  return {
    id: s.id,
    name: s.name,
    objective: s.objective ?? '',
    status: s.status,
    channels: s.channels ?? [],
    budget: s.budget ?? 0,
    timeframe: s.timeframe ?? '',
    kpis: s.kpis ?? [],
    audiences: s.audiences ?? [],
    metadata: s.metadata ?? {},
  };
}

// ── Gantt Timeline ─────────────────────────────────────────────
const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TIMELINE_START = new Date('2026-02-01');
const TIMELINE_END = new Date('2026-12-31');
const TOTAL_DAYS = Math.ceil((TIMELINE_END.getTime() - TIMELINE_START.getTime()) / 86_400_000);

const CATEGORY_COLORS: Record<string, string> = {
  BRAND: 'bg-violet-500/80',
  AGGREGATOR: 'bg-sky-500/80',
  BROKER: 'bg-emerald-500/80',
};
const CATEGORY_BG: Record<string, string> = {
  BRAND: 'bg-violet-500/10',
  AGGREGATOR: 'bg-sky-500/10',
  BROKER: 'bg-emerald-500/10',
};

function dayOffset(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - TIMELINE_START.getTime()) / 86_400_000));
}

function GanttTimeline({ strategies }: { strategies: Strategy[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const ganttRows = useMemo(() => {
    const rows = strategies
      .filter((s) => s.metadata.start_date)
      .sort((a, b) => {
        const catOrder = ['BRAND', 'AGGREGATOR', 'BROKER'];
        const ca = catOrder.indexOf(a.metadata.category ?? '');
        const cb = catOrder.indexOf(b.metadata.category ?? '');
        if (ca !== cb) return ca - cb;
        return new Date(a.metadata.start_date!).getTime() - new Date(b.metadata.start_date!).getTime();
      });
    return rows;
  }, [strategies]);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const offset = Math.max(0, Math.ceil((now.getTime() - TIMELINE_START.getTime()) / 86_400_000));
      const pct = offset / TOTAL_DAYS;
      const scrollTo = pct * scrollRef.current.scrollWidth - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, []);

  if (ganttRows.length === 0) return null;

  // Today marker
  const todayOffset = dayOffset(new Date().toISOString().split('T')[0]);
  const todayPct = (todayOffset / TOTAL_DAYS) * 100;

  let lastCategory = '';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          2026 Campaign Timeline
        </CardTitle>
        <CardDescription className="text-xs">Feb – Dec 2026 · Scroll horizontally to navigate</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="overflow-x-auto">
          <div style={{ minWidth: 1100 }}>
            {/* Month headers */}
            <div className="flex border-b border-border/50 sticky top-0 bg-background z-10">
              <div className="w-52 shrink-0 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border/30">
                Campaign
              </div>
              <div className="flex-1 flex">
                {MONTHS.map((m, i) => {
                  const monthStart = new Date(2026, i + 1, 1);
                  const monthEnd = new Date(2026, i + 2, 0);
                  const startPct = (dayOffset(monthStart.toISOString().split('T')[0]) / TOTAL_DAYS) * 100;
                  const endPct = (dayOffset(monthEnd.toISOString().split('T')[0]) / TOTAL_DAYS) * 100;
                  const widthPct = endPct - startPct;
                  return (
                    <div
                      key={m}
                      className="text-center text-[10px] font-medium text-muted-foreground py-2 border-r border-border/20"
                      style={{ width: `${widthPct}%` }}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            {ganttRows.map((s) => {
              const cat = s.metadata.category ?? '';
              const showCatHeader = cat !== lastCategory;
              lastCategory = cat;

              const start = s.metadata.start_date!;
              const end = s.metadata.end_date ?? start;
              const leftPct = (dayOffset(start) / TOTAL_DAYS) * 100;
              const rightPct = (dayOffset(end) / TOTAL_DAYS) * 100;
              const widthPct = Math.max(rightPct - leftPct, 0.8);
              const barColor = CATEGORY_COLORS[cat] ?? 'bg-primary/60';
              const milestones = s.metadata.milestones ?? [];

              return (
                <div key={s.id}>
                  {showCatHeader && (
                    <div className={cn('flex border-b border-border/30', CATEGORY_BG[cat])}>
                      <div className="w-52 shrink-0 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {cat}
                      </div>
                      <div className="flex-1" />
                    </div>
                  )}
                  <div className="flex border-b border-border/20 hover:bg-muted/30 transition-colors group">
                    <div className="w-52 shrink-0 px-3 py-2.5 text-[11px] font-medium truncate border-r border-border/20" title={s.name}>
                      {s.name}
                    </div>
                    <div className="flex-1 relative py-2">
                      {/* Today line */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-400/50 z-10"
                        style={{ left: `${todayPct}%` }}
                      />
                      {/* Bar */}
                      <div
                        className={cn('absolute top-1/2 -translate-y-1/2 h-5 rounded-sm', barColor)}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 6 }}
                      >
                        {/* Milestone dots */}
                        {milestones.map((ms, mi) => {
                          const msPct = widthPct > 0 ? ((dayOffset(ms.date) - dayOffset(start)) / (dayOffset(end) - dayOffset(start) || 1)) * 100 : 50;
                          return (
                            <div
                              key={mi}
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-current shadow-sm"
                              style={{ left: `${Math.min(Math.max(msPct, 5), 95)}%` }}
                              title={`${ms.date}: ${ms.label}`}
                            />
                          );
                        })}
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-0 right-0 top-full opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity">
                        <div
                          className="absolute bg-popover border border-border rounded-md shadow-lg px-3 py-2 text-[10px] max-w-xs"
                          style={{ left: `${leftPct}%` }}
                        >
                          <p className="font-semibold text-[11px]">{s.name}</p>
                          <p className="text-muted-foreground mt-0.5">{s.timeframe}</p>
                          {milestones.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-muted-foreground">
                              {milestones.slice(0, 4).map((ms, i) => (
                                <li key={i}>· {ms.date.slice(5)}: {ms.label}</li>
                              ))}
                              {milestones.length > 4 && <li>· +{milestones.length - 4} more</li>}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-4 px-3 py-2 border-t border-border/30">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-2 rounded-sm', color)} />
                  <span className="text-[10px] text-muted-foreground capitalize">{cat.toLowerCase()}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-px h-3 bg-red-400/60" />
                <span className="text-[10px] text-muted-foreground">Today</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TOTAL_BUDGET = 187500;
const SECTION_BUDGETS: Record<string, number> = {
  BRAND: 80000,
  AGGREGATOR: 91500,
  BROKER: 41000,
};

function BudgetTracker({ strategies }: { strategies: Strategy[] }) {
  const spendByCategory: Record<string, number> = {};
  let totalSpend = 0;
  for (const s of strategies) {
    const cat = s.metadata.category ?? 'OTHER';
    spendByCategory[cat] = (spendByCategory[cat] ?? 0) + s.budget;
    totalSpend += s.budget;
  }

  const sections = [
    { key: 'BRAND', label: 'Brand', color: 'bg-violet-500', allocated: SECTION_BUDGETS.BRAND },
    { key: 'AGGREGATOR', label: 'Aggregators', color: 'bg-sky-500', allocated: SECTION_BUDGETS.AGGREGATOR },
    { key: 'BROKER', label: 'Brokers', color: 'bg-emerald-500', allocated: SECTION_BUDGETS.BROKER },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Budget Tracker
        </CardTitle>
        <CardDescription className="text-xs">
          Total allocated: {formatCurrency(TOTAL_BUDGET)} · Committed: {formatCurrency(totalSpend)} ({Math.round((totalSpend / TOTAL_BUDGET) * 100)}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Total Budget</span>
            <span>{formatCurrency(totalSpend)} / {formatCurrency(TOTAL_BUDGET)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', totalSpend > TOTAL_BUDGET ? 'bg-red-500' : 'bg-primary')}
              style={{ width: `${Math.min((totalSpend / TOTAL_BUDGET) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Section breakdown */}
        <div className="grid gap-3 sm:grid-cols-3">
          {sections.map(({ key, label, color, allocated }) => {
            const spent = spendByCategory[key] ?? 0;
            const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            return (
              <div key={key} className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', color)} />
                    <span className="text-[11px] font-medium">{label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                  <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{formatCurrency(spent)}</span>
                  <span>{formatCurrency(allocated)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CampaignStrategy() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'timeline'>('timeline');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addObjective, setAddObjective] = useState('');
  const [addBudget, setAddBudget] = useState('');
  const [addTimeframe, setAddTimeframe] = useState('');
  const [addChannels, setAddChannels] = useState('');

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApiStrategy[]>>('/strategies');
      if (res.success && res.data) {
        setStrategies(res.data.map(mapApiStrategy));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load strategies';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const totalBudget = strategies.reduce((s, st) => s + st.budget, 0);
  const activeCount = strategies.filter((s) => s.status === 'active').length;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post<ApiResponse<ApiStrategy>>('/strategies', {
        name: addName,
        objective: addObjective,
        status: 'planning',
        channels: addChannels.split(',').map((c) => c.trim()).filter(Boolean),
        budget: parseInt(addBudget, 10) || 0,
        timeframe: addTimeframe,
        kpis: [],
        audiences: [],
      });
      setShowAdd(false);
      setAddName('');
      setAddObjective('');
      setAddBudget('');
      setAddTimeframe('');
      setAddChannels('');
      toast.success('Strategy created');
      await fetchStrategies();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create strategy';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaign Strategy"
        description="High-level strategy planning and KPI tracking"
        actions={
          <div className="flex gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setView('timeline')}
                className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors', view === 'timeline' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <GanttChart className="h-3 w-3" /> Timeline
              </button>
              <button
                onClick={() => setView('cards')}
                className={cn('px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors border-l border-border', view === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <LayoutList className="h-3 w-3" /> Cards
              </button>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/skills')}>
              <Sparkles className="h-3.5 w-3.5" />
              Generate Ideas
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Strategy
            </Button>
          </div>
        }
      />

      {/* Add Strategy Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>New Strategy</DialogTitle>
          <DialogDescription>Create a new campaign strategy.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Strategy Name *</label>
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Q2 Demand Gen" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Objective</label>
            <Textarea value={addObjective} onChange={(e) => setAddObjective(e.target.value)} placeholder="What is the goal of this strategy?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget ($)</label>
              <Input type="number" value={addBudget} onChange={(e) => setAddBudget(e.target.value)} placeholder="10000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeframe</label>
              <Input value={addTimeframe} onChange={(e) => setAddTimeframe(e.target.value)} placeholder="e.g. Apr - Jun 2026" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Channels (comma-separated)</label>
            <Input value={addChannels} onChange={(e) => setAddChannels(e.target.value)} placeholder="Google Ads, LinkedIn, Email" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addName.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Create Strategy
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Strategies</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Budget</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(totalBudget)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Channels in Use</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">
            {new Set(strategies.flatMap((s) => s.channels)).size}
          </p>
        </Card>
      </div>

      {/* Gantt Timeline */}
      {view === 'timeline' && strategies.length > 0 && (
        <>
          <GanttTimeline strategies={strategies} />
          <BudgetTracker strategies={strategies} />
        </>
      )}

      {/* Strategy cards */}
      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No strategies yet"
          description="Create your first campaign strategy to start planning."
          actionLabel="New Strategy"
          onAction={() => setShowAdd(true)}
        />
      ) : (
      <div className="space-y-3">
        {strategies.map((strategy) => {
          const isExpanded = expandedId === strategy.id;

          return (
            <Card
              key={strategy.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:border-primary/20',
                isExpanded && 'border-primary/20'
              )}
              onClick={() => setExpandedId(isExpanded ? null : strategy.id)}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={statusVariant[strategy.status]} className="text-[10px] capitalize">{strategy.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{strategy.timeframe}</span>
                    </div>
                    <h3 className="text-sm font-semibold">{strategy.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{strategy.objective}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(strategy.budget)}</span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                  </div>
                </div>

                {/* Channels */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {strategy.channels.map((ch) => (
                    <span key={ch} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {ch}
                    </span>
                  ))}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-border/50 space-y-5">
                    {/* KPIs */}
                    {strategy.kpis.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Metrics</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {strategy.kpis.map((kpi, i) => (
                            <div key={i} className="rounded-lg border border-border/50 p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-lg font-bold tabular-nums">{kpi.current}</span>
                                <span className="text-[10px] text-muted-foreground">/ {kpi.target}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audiences */}
                    {strategy.audiences.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Target Audiences</p>
                        <div className="flex flex-wrap gap-1.5">
                          {strategy.audiences.map((aud) => (
                            <Badge key={aud} variant="outline" className="text-[10px] gap-1">
                              <Users className="h-2.5 w-2.5" />
                              {aud}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
