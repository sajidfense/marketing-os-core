import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Loader2,
  Calendar,
  Hash,
  BarChart3,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

// ── Types ──────────────────────────────────────────────────────

interface BlogMeta {
  blog_status?: string;
  cluster?: string;
  cluster_type?: string;
  slug?: string;
  seo_keyword?: string;
  platform?: string;
  scheduled_date?: string;
  meta_title?: string;
  meta_description?: string;
  source?: string;
  [key: string]: unknown;
}

interface ApiBlog {
  id: string;
  title: string;
  content_type: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_day: number | null;
  scheduled_month: number | null;
  scheduled_year: number | null;
  body: string | null;
  metadata: BlogMeta | null;
  created_at: string;
  updated_at: string;
}

interface Blog {
  id: string;
  title: string;
  cluster: string;
  blogStatus: string;
  scheduledDate: string;
  hasContent: boolean;
  wordCount: number;
  seoScore: number;
  slug: string;
  keyword: string;
}

function mapBlog(b: ApiBlog): Blog {
  const m = b.metadata ?? {};
  const words = b.body ? b.body.trim().split(/\s+/).length : 0;

  // Quick SEO score estimate
  let score = 0;
  const kw = (m.seo_keyword ?? '').toLowerCase();
  if (kw && b.title.toLowerCase().includes(kw)) score += 15;
  if (kw && b.body && b.body.toLowerCase().includes(kw)) score += 15;
  if (words >= 800) score += 20;
  if (m.meta_title || b.title.length >= 30) score += 10;
  if (m.meta_description) score += 10;
  if (b.body && (b.body.match(/^##\s/gm) ?? []).length >= 2) score += 10;
  if (words >= 300) score += 10;
  if (kw) score += 10;

  let dateStr = '';
  if (b.scheduled_year && b.scheduled_month && b.scheduled_day) {
    dateStr = `${b.scheduled_year}-${String(b.scheduled_month).padStart(2, '0')}-${String(b.scheduled_day).padStart(2, '0')}`;
  }

  return {
    id: b.id,
    title: b.title,
    cluster: m.cluster ?? '',
    blogStatus: m.blog_status ?? 'planned',
    scheduledDate: dateStr,
    hasContent: !!b.body && words > 50,
    wordCount: words,
    seoScore: score,
    slug: m.slug ?? '',
    keyword: m.seo_keyword ?? '',
  };
}

// ── Status config ──────────────────────────────────────────────

const STATUS_OPTIONS = ['all', 'planned', 'draft', 'ready', 'published'] as const;

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-zinc-100 text-zinc-600',
  draft: 'bg-amber-100 text-amber-700',
  ready: 'bg-blue-100 text-blue-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const CLUSTER_COLORS: Record<string, string> = {
  'Credit Understanding': 'bg-violet-100 text-violet-700',
  'Eligibility & Qualification': 'bg-sky-100 text-sky-700',
  'Comparison': 'bg-amber-100 text-amber-700',
  'Rates & Expectations': 'bg-emerald-100 text-emerald-700',
  'Credit Progression': 'bg-rose-100 text-rose-700',
  'Application Strategy': 'bg-indigo-100 text-indigo-700',
};

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-400';
}

// ══════════════════════════════════════════════════════════════
//  Blogs Page
// ══════════════════════════════════════════════════════════════

export default function Blogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCluster, setCreateCluster] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<ApiBlog[]>>('/content-items');
      if (res.success && res.data) {
        const blogItems = res.data
          .filter((i) => i.content_type === 'blog')
          .map(mapBlog)
          .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
        setBlogs(blogItems);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  // ── Filters ───────────────────────────────────────────────
  const clusters = useMemo(() => {
    const set = new Set(blogs.map((b) => b.cluster).filter(Boolean));
    return Array.from(set).sort();
  }, [blogs]);

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      if (statusFilter !== 'all' && b.blogStatus !== statusFilter) return false;
      if (clusterFilter !== 'all' && b.cluster !== clusterFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.cluster.toLowerCase().includes(q) || b.keyword.toLowerCase().includes(q);
      }
      return true;
    });
  }, [blogs, search, statusFilter, clusterFilter]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: blogs.length,
    withContent: blogs.filter((b) => b.hasContent).length,
    published: blogs.filter((b) => b.blogStatus === 'published').length,
    avgSeo: blogs.length > 0 ? Math.round(blogs.reduce((s, b) => s + b.seoScore, 0) / blogs.length) : 0,
  }), [blogs]);

  // ── Create handler ────────────────────────────────────────
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!createTitle.trim()) return;
    setCreating(true);
    try {
      const [y, m, d] = createDate ? createDate.split('-').map(Number) : [2026, 1, 1];
      const slug = createTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');
      await api.post<ApiResponse<ApiBlog>>('/content-items', {
        title: createTitle,
        content_type: 'blog',
        status: 'draft',
        scheduled_day: d,
        scheduled_month: m,
        scheduled_year: y,
        metadata: {
          blog_status: 'planned',
          cluster: createCluster || undefined,
          slug,
          platform: 'Website',
          scheduled_date: createDate || undefined,
          source: 'Manual',
        },
      });
      toast.success('Blog created');
      setShowCreate(false);
      setCreateTitle('');
      setCreateCluster('');
      setCreateDate('');
      await fetchBlogs();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes it from the calendar too.`)) return;
    try {
      await api.delete(`/content-items/${id}`);
      toast.success('Deleted');
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Blog Management"
        description={`${blogs.length} blogs · Content calendar synced`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> New Blog
          </Button>
        }
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <DialogTitle>Create Blog</DialogTitle>
          <DialogDescription>New blog posts automatically appear in the content calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g. How to improve your credit score" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cluster</label>
              <select value={createCluster} onChange={(e) => setCreateCluster(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">None</option>
                {clusters.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Publish Date</label>
              <Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={creating || !createTitle.trim()}>
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Blogs</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">With Content</p>
          <p className="text-xl font-bold tabular-nums mt-0.5 text-emerald-600">{stats.withContent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Published</p>
          <p className="text-xl font-bold tabular-nums mt-0.5 text-blue-600">{stats.published}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg SEO Score</p>
          <p className={cn('text-xl font-bold tabular-nums mt-0.5', scoreColor(stats.avgSeo))}>{stats.avgSeo}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blogs..." className="pl-9 text-xs h-8" />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <select value={clusterFilter} onChange={(e) => setClusterFilter(e.target.value)}
            className="appearance-none rounded-md bg-muted px-3 pr-7 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer">
            <option value="all">All clusters</option>
            {clusters.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>

        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} of {blogs.length} blogs
        </span>
      </div>

      {/* Blog Table */}
      {blogs.length === 0 ? (
        <EmptyState icon={FileText} title="No blogs yet" description="Create your first blog to get started." actionLabel="Create Blog" onAction={() => setShowCreate(true)} />
      ) : (
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_80px_90px_60px_60px_36px] gap-3 px-4 py-2.5 border-b border-border/50 bg-muted/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Title</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cluster</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Words</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">SEO</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/20">
            {filtered.map((blog) => {
              const ccls = CLUSTER_COLORS[blog.cluster] ?? 'bg-muted text-muted-foreground';
              const scls = STATUS_COLORS[blog.blogStatus] ?? 'bg-muted text-muted-foreground';
              const dateDisplay = blog.scheduledDate ? new Date(blog.scheduledDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—';

              return (
                <div key={blog.id}
                  className="grid grid-cols-[1fr_140px_80px_90px_60px_60px_36px] gap-3 px-4 py-3 items-center hover:bg-muted/20 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/blog/${blog.id}`)}>
                  {/* Title + slug */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{blog.title}</p>
                    {blog.slug && <p className="text-[9px] text-muted-foreground truncate mt-0.5">/{blog.slug}</p>}
                  </div>
                  {/* Cluster */}
                  <div>
                    {blog.cluster ? (
                      <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium', ccls)}>
                        <Hash className="h-2 w-2" />{blog.cluster.length > 18 ? blog.cluster.slice(0, 18) + '...' : blog.cluster}
                      </span>
                    ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  </div>
                  {/* Status */}
                  <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium capitalize w-fit', scls)}>
                    {blog.blogStatus}
                  </span>
                  {/* Date */}
                  <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{dateDisplay}
                  </span>
                  {/* Word count */}
                  <span className={cn('text-[11px] tabular-nums text-right', blog.wordCount >= 800 ? 'text-foreground' : 'text-muted-foreground')}>
                    {blog.wordCount > 0 ? blog.wordCount.toLocaleString() : '—'}
                  </span>
                  {/* SEO score */}
                  <span className={cn('text-[11px] font-semibold tabular-nums text-right', scoreColor(blog.seoScore))}>
                    {blog.seoScore}
                  </span>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(blog.id, blog.title); }}
                    className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
