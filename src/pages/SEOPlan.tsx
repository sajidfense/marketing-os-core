import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import {
  SearchCheck,
  Plus,
  TrendingUp,
  Target,
  Globe,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

type TaskStatus = 'done' | 'in-progress' | 'todo';

interface SEOTask {
  id: string;
  title: string;
  category: 'technical' | 'on-page' | 'content' | 'off-page';
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  impact: string;
}

interface ApiSEOTask {
  id: string;
  organization_id: string;
  title: string;
  category: 'technical' | 'on-page' | 'content' | 'off-page';
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  impact: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<TaskStatus, { icon: typeof CheckCircle2; variant: 'success' | 'default' | 'secondary' }> = {
  done: { icon: CheckCircle2, variant: 'success' },
  'in-progress': { icon: Clock, variant: 'default' },
  todo: { icon: Circle, variant: 'secondary' },
};

const priorityConfig: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

const categoryColors: Record<string, string> = {
  technical: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'on-page': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  content: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'off-page': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function mapApiTask(t: ApiSEOTask): SEOTask {
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    impact: t.impact ?? 'To be assessed',
  };
}

export default function SEOPlan() {
  const [tasks, setTasks] = useState<SEOTask[]>([]);
  const [loading, setLoading] = useState(true);
  const importedRef = useRef(false);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState<SEOTask['category']>('technical');
  const [addPriority, setAddPriority] = useState<SEOTask['priority']>('medium');
  const [addImpact, setAddImpact] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApiSEOTask[]>>('/seo-tasks');
      if (res.success && res.data) {
        setTasks(res.data.map(mapApiTask));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load SEO tasks';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Pick up tasks from SEO Analyzer / Report pages via sessionStorage
  useEffect(() => {
    if (loading || importedRef.current) return;
    importedRef.current = true;

    const stored = sessionStorage.getItem('seo-plan-tasks');
    if (!stored) return;

    try {
      const incoming = JSON.parse(stored) as SEOTask[];
      if (incoming.length > 0) {
        // POST each task to the API, then re-fetch
        const promises = incoming.map((task) =>
          api.post<ApiResponse<ApiSEOTask>>('/seo-tasks', {
            title: task.title,
            category: task.category,
            priority: task.priority,
            status: task.status,
            impact: task.impact,
          })
        );
        Promise.all(promises)
          .then(() => {
            toast.success(`${incoming.length} tasks imported from SEO report`);
            fetchTasks();
          })
          .catch(() => {
            toast.error('Failed to import some SEO tasks');
          });
      }
    } catch { /* ignore */ }
    sessionStorage.removeItem('seo-plan-tasks');
  }, [loading, fetchTasks]);

  const filteredTasks = categoryFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.category === categoryFilter);

  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post<ApiResponse<ApiSEOTask>>('/seo-tasks', {
        title: addTitle,
        category: addCategory,
        priority: addPriority,
        status: 'todo',
        impact: addImpact || 'To be assessed',
      });
      setShowAdd(false);
      setAddTitle('');
      setAddImpact('');
      setAddCategory('technical');
      setAddPriority('medium');
      toast.success('SEO task added');
      await fetchTasks();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add SEO task';
      toast.error(message);
    }
  }

  async function cycleStatus(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const next: TaskStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: next } : t))
    );

    try {
      await api.patch<ApiResponse<ApiSEOTask>>(`/seo-tasks/${id}`, { status: next });
      toast.success('Status updated');
    } catch (err) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
      const message = err instanceof ApiError ? err.message : 'Failed to update status';
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
        title="SEO Plan"
        description="Strategic SEO roadmap and keyword tracking"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        }
      />

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>Add SEO Task</DialogTitle>
          <DialogDescription>Add a new action item to your SEO plan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title *</label>
            <Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="e.g. Optimize meta descriptions for product pages" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as SEOTask['category'])}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="technical">Technical</option>
                <option value="on-page">On-Page</option>
                <option value="content">Content</option>
                <option value="off-page">Off-Page</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={addPriority}
                onChange={(e) => setAddPriority(e.target.value as SEOTask['priority'])}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Impact</label>
            <Input value={addImpact} onChange={(e) => setAddImpact(e.target.value)} placeholder="e.g. +20% organic traffic" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addTitle.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        </form>
      </Dialog>

      {tasks.length === 0 && (
        <EmptyState
          icon={SearchCheck}
          title="No SEO plan yet"
          description="Run your first SEO analysis to generate action items, or add tasks manually."
          actionLabel="Add Task"
          onAction={() => setShowAdd(true)}
        />
      )}

      {/* Overview cards */}
      {tasks.length > 0 && <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Plan Progress</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{progress}%</p>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Keywords Tracked</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg. Position</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">-</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks Remaining</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{tasks.length - done}</p>
        </Card>
      </div>}

      {/* SEO Tasks */}
      {tasks.length > 0 && <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Action Items</h2>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {['all', 'technical', 'on-page', 'content', 'off-page'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors capitalize',
                  categoryFilter === cat ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const sc = statusConfig[task.status];
            const StatusIcon = sc.icon;
            const isExpanded = expandedTask === task.id;

            return (
              <Card
                key={task.id}
                className="cursor-pointer hover:border-primary/20 transition-all duration-150"
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleStatus(task.id);
                      }}
                      className="shrink-0"
                      title="Click to change status"
                    >
                      <StatusIcon className="h-4 w-4" style={{ color: sc.variant === 'success' ? '#22C55E' : sc.variant === 'default' ? '#6366F1' : '#64748B' }} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn('text-[9px]', categoryColors[task.category])}>
                        {task.category}
                      </Badge>
                      <Badge variant={priorityConfig[task.priority]} className="text-[9px]">{task.priority}</Badge>
                      <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground/70 font-medium">Impact:</span> {task.impact}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>}
    </div>
  );
}
