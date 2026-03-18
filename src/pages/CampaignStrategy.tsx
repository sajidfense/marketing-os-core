import { useState, type FormEvent } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

const statusVariant: Record<string, 'success' | 'default' | 'secondary' | 'warning'> = {
  active: 'success',
  planning: 'default',
  completed: 'secondary',
  paused: 'warning',
};

const initialStrategies: Strategy[] = [
  {
    id: '1',
    name: 'Q1 Growth Campaign',
    objective: 'Increase MQLs by 40% through multi-channel paid and organic efforts.',
    status: 'active',
    channels: ['Google Ads', 'LinkedIn', 'Blog', 'Email'],
    budget: 25000,
    timeframe: 'Jan - Mar 2026',
    kpis: [
      { label: 'MQLs', target: '500', current: '312' },
      { label: 'CAC', target: '$48', current: '$52' },
      { label: 'Pipeline', target: '$250K', current: '$180K' },
    ],
    audiences: ['SaaS Founders', 'Marketing Directors', 'CMOs'],
  },
  {
    id: '2',
    name: 'Brand Awareness Push',
    objective: 'Build brand recognition in target market through content and social.',
    status: 'active',
    channels: ['Instagram', 'TikTok', 'YouTube', 'Blog'],
    budget: 12000,
    timeframe: 'Feb - Apr 2026',
    kpis: [
      { label: 'Reach', target: '500K', current: '280K' },
      { label: 'Followers', target: '+2,000', current: '+1,240' },
      { label: 'Engagement', target: '4.5%', current: '3.8%' },
    ],
    audiences: ['Startup Teams', 'Digital Marketers'],
  },
  {
    id: '3',
    name: 'Product Launch - Summer',
    objective: 'Launch new product tier with coordinated campaign across all channels.',
    status: 'planning',
    channels: ['Email', 'Google Ads', 'PR', 'Social'],
    budget: 35000,
    timeframe: 'Jun - Jul 2026',
    kpis: [
      { label: 'Signups', target: '1,000', current: '-' },
      { label: 'Revenue', target: '$100K', current: '-' },
    ],
    audiences: ['Current Users', 'Enterprise Prospects'],
  },
  {
    id: '4',
    name: 'SEO Content Engine',
    objective: 'Build topical authority through systematic content creation.',
    status: 'active',
    channels: ['Blog', 'YouTube'],
    budget: 8000,
    timeframe: 'Ongoing',
    kpis: [
      { label: 'Organic Traffic', target: '+60%', current: '+28%' },
      { label: 'Rankings Top 10', target: '50', current: '22' },
    ],
    audiences: ['Organic Searchers'],
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function CampaignStrategy() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addObjective, setAddObjective] = useState('');
  const [addBudget, setAddBudget] = useState('');
  const [addTimeframe, setAddTimeframe] = useState('');
  const [addChannels, setAddChannels] = useState('');

  const totalBudget = strategies.reduce((s, st) => s + st.budget, 0);
  const activeCount = strategies.filter((s) => s.status === 'active').length;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const newStrategy: Strategy = {
      id: String(Date.now()),
      name: addName,
      objective: addObjective,
      status: 'planning',
      channels: addChannels.split(',').map((c) => c.trim()).filter(Boolean),
      budget: parseInt(addBudget, 10) || 0,
      timeframe: addTimeframe,
      kpis: [],
      audiences: [],
    };
    setStrategies((prev) => [...prev, newStrategy]);
    setShowAdd(false);
    setAddName('');
    setAddObjective('');
    setAddBudget('');
    setAddTimeframe('');
    setAddChannels('');
    toast.success('Strategy created');
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
    </div>
  );
}
