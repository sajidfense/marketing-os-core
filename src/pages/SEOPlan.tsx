import { useState, type FormEvent } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type TaskStatus = 'done' | 'in-progress' | 'todo';

interface SEOTask {
  id: string;
  title: string;
  category: 'technical' | 'on-page' | 'content' | 'off-page';
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  impact: string;
}

interface KeywordTarget {
  keyword: string;
  currentRank: number | null;
  targetRank: number;
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  page: string;
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

const initialTasks: SEOTask[] = [
  { id: '1', title: 'Fix crawl errors in Google Search Console', category: 'technical', priority: 'high', status: 'done', impact: 'Improves indexation' },
  { id: '2', title: 'Add structured data (FAQ, Product)', category: 'technical', priority: 'high', status: 'in-progress', impact: 'Rich snippet eligibility' },
  { id: '3', title: 'Optimize title tags for top 10 pages', category: 'on-page', priority: 'high', status: 'in-progress', impact: '+15% CTR potential' },
  { id: '4', title: 'Internal linking audit and optimization', category: 'on-page', priority: 'medium', status: 'todo', impact: 'Better authority flow' },
  { id: '5', title: 'Create pillar content for "marketing automation"', category: 'content', priority: 'high', status: 'todo', impact: 'Topical authority' },
  { id: '6', title: 'Write 5 supporting blog posts', category: 'content', priority: 'medium', status: 'todo', impact: 'Content cluster' },
  { id: '7', title: 'Guest post outreach (10 sites)', category: 'off-page', priority: 'medium', status: 'todo', impact: '+8 backlinks' },
  { id: '8', title: 'Image compression and WebP conversion', category: 'technical', priority: 'low', status: 'done', impact: '-2s load time' },
];

const mockKeywords: KeywordTarget[] = [
  { keyword: 'marketing automation software', currentRank: 18, targetRank: 5, volume: 12100, difficulty: 'hard', page: '/features' },
  { keyword: 'email marketing tools', currentRank: 24, targetRank: 10, volume: 8100, difficulty: 'medium', page: '/email' },
  { keyword: 'social media scheduler', currentRank: null, targetRank: 15, volume: 6600, difficulty: 'medium', page: '/social' },
  { keyword: 'marketing os', currentRank: 8, targetRank: 3, volume: 2400, difficulty: 'easy', page: '/' },
  { keyword: 'campaign management tool', currentRank: 32, targetRank: 10, volume: 4400, difficulty: 'hard', page: '/campaigns' },
];

const difficultyVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'destructive',
};

export default function SEOPlan() {
  const [tasks, setTasks] = useState<SEOTask[]>(initialTasks);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState<SEOTask['category']>('technical');
  const [addPriority, setAddPriority] = useState<SEOTask['priority']>('medium');
  const [addImpact, setAddImpact] = useState('');

  const filteredTasks = categoryFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.category === categoryFilter);

  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = Math.round((done / tasks.length) * 100);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const newTask: SEOTask = {
      id: String(Date.now()),
      title: addTitle,
      category: addCategory,
      priority: addPriority,
      status: 'todo',
      impact: addImpact || 'To be assessed',
    };
    setTasks((prev) => [...prev, newTask]);
    setShowAdd(false);
    setAddTitle('');
    setAddImpact('');
    setAddCategory('technical');
    setAddPriority('medium');
    toast.success('SEO task added');
  }

  function cycleStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: TaskStatus = t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo';
        return { ...t, status: next };
      })
    );
    toast.success('Status updated');
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

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Plan Progress</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{progress}%</p>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Keywords Tracked</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{mockKeywords.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg. Position</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">
            {Math.round(mockKeywords.filter((k) => k.currentRank).reduce((s, k) => s + (k.currentRank ?? 0), 0) / mockKeywords.filter((k) => k.currentRank).length)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks Remaining</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{tasks.length - done}</p>
        </Card>
      </div>

      {/* Keyword Targets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Keyword Targets</CardTitle>
          <CardDescription>Track your ranking progress for priority keywords</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword</th>
                  <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                  <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
                  <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
                  <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                  <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Page</th>
                </tr>
              </thead>
              <tbody>
                {mockKeywords.map((kw, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium">{kw.keyword}</td>
                    <td className="py-3 text-center">
                      {kw.currentRank ? (
                        <span className="tabular-nums font-medium">#{kw.currentRank}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className="tabular-nums text-primary font-medium">#{kw.targetRank}</span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{kw.volume.toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <Badge variant={difficultyVariant[kw.difficulty]} className="text-[10px]">{kw.difficulty}</Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{kw.page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SEO Tasks */}
      <div>
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
      </div>
    </div>
  );
}
