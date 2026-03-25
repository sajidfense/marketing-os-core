import { useState, useEffect, useCallback, type FormEvent } from 'react';
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
  };
}

export default function CampaignStrategy() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
