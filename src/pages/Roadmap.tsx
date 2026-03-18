import { useState } from 'react';
import {
  Map,
  Plus,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  ChevronDown,
  Link2,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';

type MilestoneStatus = 'completed' | 'in-progress' | 'planned' | 'at-risk';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  date: string;
  linkedItems: { label: string; type: 'campaign' | 'content' | 'seo' }[];
  dependencies: string[];
}

const statusConfig: Record<MilestoneStatus, { label: string; icon: typeof CheckCircle2; color: string; badge: 'success' | 'default' | 'secondary' | 'warning' }> = {
  'completed': { label: 'Completed', icon: CheckCircle2, color: '#22C55E', badge: 'success' },
  'in-progress': { label: 'In Progress', icon: Clock, color: '#6366F1', badge: 'default' },
  'planned': { label: 'Planned', icon: Circle, color: '#64748B', badge: 'secondary' },
  'at-risk': { label: 'At Risk', icon: AlertCircle, color: '#F59E0B', badge: 'warning' },
};

const mockMilestones: Milestone[] = [
  {
    id: '1',
    title: 'Brand Identity Finalized',
    description: 'Complete brand guidelines, logo, and visual identity system.',
    status: 'completed',
    date: 'Jan 15',
    linkedItems: [{ label: 'Brand Guidelines', type: 'content' }],
    dependencies: [],
  },
  {
    id: '2',
    title: 'Website Launch',
    description: 'Deploy new marketing website with SEO-optimized pages.',
    status: 'completed',
    date: 'Feb 1',
    linkedItems: [
      { label: 'SEO Audit', type: 'seo' },
      { label: 'Landing Pages', type: 'content' },
    ],
    dependencies: ['1'],
  },
  {
    id: '3',
    title: 'Q1 Campaign Launch',
    description: 'Launch multi-channel campaign across Google, Meta, and LinkedIn.',
    status: 'in-progress',
    date: 'Mar 1',
    linkedItems: [
      { label: 'Spring Campaign', type: 'campaign' },
      { label: 'Ad Creatives', type: 'content' },
    ],
    dependencies: ['2'],
  },
  {
    id: '4',
    title: 'Content Engine Live',
    description: 'Blog, social, and video content pipeline operational.',
    status: 'in-progress',
    date: 'Mar 15',
    linkedItems: [
      { label: 'Blog Calendar', type: 'content' },
      { label: 'Social Strategy', type: 'campaign' },
    ],
    dependencies: ['2'],
  },
  {
    id: '5',
    title: 'Lead Gen System',
    description: 'Complete lead capture, scoring, and handoff pipeline.',
    status: 'planned',
    date: 'Apr 1',
    linkedItems: [
      { label: 'Lead Forms', type: 'campaign' },
    ],
    dependencies: ['3'],
  },
  {
    id: '6',
    title: 'Q2 Strategy Review',
    description: 'Performance review and Q2 planning with stakeholders.',
    status: 'planned',
    date: 'Apr 15',
    linkedItems: [],
    dependencies: ['3', '4', '5'],
  },
];

const linkedTypeColors: Record<string, string> = {
  campaign: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  content: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  seo: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function TimelineConnector({ active }: { active: boolean }) {
  return (
    <div className={cn('absolute left-5 top-12 bottom-0 w-px', active ? 'bg-primary/30' : 'bg-border/50')} />
  );
}

export default function Roadmap() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MilestoneStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? mockMilestones
    : mockMilestones.filter((m) => m.status === filter);

  const completedCount = mockMilestones.filter((m) => m.status === 'completed').length;
  const progress = Math.round((completedCount / mockMilestones.length) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roadmap"
        description="Marketing milestones and strategic timeline"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Milestone
          </Button>
        }
      />

      {/* Progress bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-xs text-muted-foreground">{completedCount} of {mockMilestones.length} milestones completed</p>
          </div>
          <span className="text-2xl font-bold tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 w-fit">
        {(['all', 'completed', 'in-progress', 'planned', 'at-risk'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'all' ? 'All' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {filtered.map((milestone, i) => {
          const config = statusConfig[milestone.status];
          const StatusIcon = config.icon;
          const isExpanded = expandedId === milestone.id;
          const isLast = i === filtered.length - 1;

          return (
            <div key={milestone.id} className="relative pl-12 pb-8">
              {/* Connector line */}
              {!isLast && <TimelineConnector active={milestone.status === 'in-progress'} />}

              {/* Status dot */}
              <div
                className="absolute left-2.5 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background"
                style={{ borderColor: config.color }}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
              </div>

              {/* Card */}
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:border-primary/20',
                  isExpanded && 'border-primary/20'
                )}
                onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={config.badge} className="text-[10px] gap-1">
                          <StatusIcon className="h-2.5 w-2.5" />
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{milestone.date}</span>
                      </div>
                      <h3 className="text-sm font-semibold leading-tight">{milestone.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{milestone.description}</p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      {/* Linked items */}
                      {milestone.linkedItems.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Linked Items
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {milestone.linkedItems.map((item, j) => (
                              <Badge key={j} variant="outline" className={cn('text-[10px] gap-1', linkedTypeColors[item.type])}>
                                <Link2 className="h-2.5 w-2.5" />
                                {item.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependencies */}
                      {milestone.dependencies.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Depends On
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {milestone.dependencies.map((depId) => {
                              const dep = mockMilestones.find((m) => m.id === depId);
                              if (!dep) return null;
                              const depConfig = statusConfig[dep.status];
                              return (
                                <Badge key={depId} variant="outline" className="text-[10px] gap-1">
                                  <Flag className="h-2.5 w-2.5" style={{ color: depConfig.color }} />
                                  {dep.title}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
          <div className="mb-4 rounded-2xl bg-muted/50 p-4">
            <Map className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1.5 text-base font-semibold">No milestones found</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            No milestones match the current filter. Try selecting a different status.
          </p>
        </div>
      )}
    </div>
  );
}
