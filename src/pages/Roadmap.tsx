import { useState, useEffect, useCallback, type FormEvent } from 'react';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

type MilestoneStatus = 'completed' | 'in-progress' | 'planned' | 'at-risk';

/** Shape returned by the API (matches roadmap_milestones table). */
interface ApiMilestone {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  target_date: string;
  linked_items: { label: string; type: 'campaign' | 'content' | 'seo' }[];
  dependencies: string[];
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Front-end model used by the UI. */
interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  date: string;
  linkedItems: { label: string; type: 'campaign' | 'content' | 'seo' }[];
  dependencies: string[];
}

/** Map an API row into the front-end Milestone shape. */
function toMilestone(row: ApiMilestone): Milestone {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    date: row.target_date,
    linkedItems: row.linked_items ?? [],
    dependencies: row.dependencies ?? [],
  };
}

const statusConfig: Record<MilestoneStatus, { label: string; icon: typeof CheckCircle2; color: string; badge: 'success' | 'default' | 'secondary' | 'warning' }> = {
  'completed': { label: 'Completed', icon: CheckCircle2, color: '#22C55E', badge: 'success' },
  'in-progress': { label: 'In Progress', icon: Clock, color: '#6366F1', badge: 'default' },
  'planned': { label: 'Planned', icon: Circle, color: '#64748B', badge: 'secondary' },
  'at-risk': { label: 'At Risk', icon: AlertCircle, color: '#F59E0B', badge: 'warning' },
};

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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MilestoneStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addStatus, setAddStatus] = useState<MilestoneStatus>('planned');
  const [saving, setSaving] = useState(false);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApiMilestone[]>>('/roadmap');
      setMilestones((res.data ?? []).map(toMilestone));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load milestones';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const filtered = filter === 'all'
    ? milestones
    : milestones.filter((m) => m.status === filter);

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post<ApiResponse<ApiMilestone>>('/roadmap', {
        title: addTitle,
        description: addDesc,
        target_date: addDate,
        status: addStatus,
        linked_items: [],
        dependencies: [],
      });
      setShowAdd(false);
      setAddTitle('');
      setAddDesc('');
      setAddDate('');
      setAddStatus('planned');
      toast.success('Milestone added');
      await fetchMilestones();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add milestone';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: MilestoneStatus) {
    // Optimistic update
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    try {
      await api.patch<ApiResponse<ApiMilestone>>(`/roadmap/${id}`, { status: newStatus });
      toast.success('Status updated');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update status';
      toast.error(message);
      // Revert on failure
      await fetchMilestones();
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Roadmap"
          description="Marketing milestones and strategic timeline"
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roadmap"
        description="Marketing milestones and strategic timeline"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Milestone
          </Button>
        }
      />

      {/* Add Milestone Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>Add Milestone</DialogTitle>
          <DialogDescription>Add a new milestone to your marketing roadmap.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="e.g. Q2 Campaign Launch" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={addDesc} onChange={(e) => setAddDesc(e.target.value)} placeholder="Describe this milestone..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input value={addDate} onChange={(e) => setAddDate(e.target.value)} placeholder="e.g. Apr 30" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={addStatus}
                onChange={(e) => setAddStatus(e.target.value as MilestoneStatus)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addTitle.trim() || !addDate.trim() || saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? 'Adding...' : 'Add Milestone'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Progress bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">Overall Progress</p>
            <p className="text-xs text-muted-foreground">{completedCount} of {milestones.length} milestones completed</p>
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
                      {/* Status change */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Change Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(statusConfig) as MilestoneStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(milestone.id, s);
                              }}
                              className={cn(
                                'rounded-md px-2 py-1 text-[10px] font-medium border transition-colors',
                                milestone.status === s
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                              )}
                            >
                              {statusConfig[s].label}
                            </button>
                          ))}
                        </div>
                      </div>

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
                              const dep = milestones.find((m) => m.id === depId);
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
          <h3 className="mb-1.5 text-base font-semibold">
            {milestones.length === 0 ? 'No milestones yet' : 'No milestones found'}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            {milestones.length === 0
              ? 'Add your first milestone to start building your marketing roadmap.'
              : 'No milestones match the current filter. Try selecting a different status.'}
          </p>
          {milestones.length === 0 && (
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Milestone
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
