import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Sparkles,
  FileText,
  Search,
  Hash,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

// ── Types ──────────────────────────────────────────────────────

interface BlogMetadata {
  blog_status?: string;
  cluster?: string;
  cluster_goal?: string;
  cluster_type?: string;
  slug?: string;
  seo_keyword?: string;
  platform?: string;
  scheduled_date?: string;
  meta_title?: string;
  meta_description?: string;
  notes?: string;
  published_date?: string;
  [key: string]: unknown;
}

interface ApiBlogItem {
  id: string;
  organization_id: string;
  title: string;
  content_type: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_day: number | null;
  scheduled_month: number | null;
  scheduled_year: number | null;
  body: string | null;
  metadata: BlogMetadata;
  created_at: string;
  updated_at: string;
}

const BLOG_STATUSES = ['planned', 'draft', 'ready', 'published'] as const;
type BlogStatus = (typeof BLOG_STATUSES)[number];

const STATUS_CONFIG: Record<BlogStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  planned: { label: 'Planned', color: 'bg-zinc-500', icon: FileText },
  draft: { label: 'Draft', color: 'bg-amber-500', icon: FileText },
  ready: { label: 'Ready', color: 'bg-blue-500', icon: CheckCircle2 },
  published: { label: 'Published', color: 'bg-emerald-500', icon: CheckCircle2 },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Blog Editor Component ──────────────────────────────────────

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Blog fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('planned');
  const [slug, setSlug] = useState('');
  const [cluster, setCluster] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [originalData, setOriginalData] = useState<ApiBlogItem | null>(null);

  const titleRef = useRef<HTMLTextAreaElement>(null);

  // ── Load blog data ──────────────────────────────────────────

  const loadBlog = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<ApiResponse<ApiBlogItem>>(`/content-items/${id}`);
      if (res.success && res.data) {
        const b = res.data;
        setOriginalData(b);
        setTitle(b.title);
        setBody(b.body ?? '');
        setSlug(b.metadata.slug ?? slugify(b.title));
        setCluster(b.metadata.cluster ?? '');
        setTargetKeyword(b.metadata.seo_keyword ?? '');
        setMetaTitle(b.metadata.meta_title ?? '');
        setMetaDescription(b.metadata.meta_description ?? '');
        setNotes(b.metadata.notes ?? '');
        setBlogStatus((b.metadata.blog_status as BlogStatus) ?? 'planned');

        if (b.scheduled_year && b.scheduled_month && b.scheduled_day) {
          const d = `${b.scheduled_year}-${String(b.scheduled_month).padStart(2, '0')}-${String(b.scheduled_day).padStart(2, '0')}`;
          setScheduledDate(d);
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load blog';
      toast.error(msg);
      navigate('/content-calendar');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  // ── Save handler ────────────────────────────────────────────

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const [year, month, day] = scheduledDate
        ? scheduledDate.split('-').map(Number)
        : [originalData?.scheduled_year, originalData?.scheduled_month, originalData?.scheduled_day];

      // Map blog_status to DB status
      let dbStatus: 'draft' | 'scheduled' | 'published' = 'draft';
      if (blogStatus === 'ready') dbStatus = 'scheduled';
      if (blogStatus === 'published') dbStatus = 'published';

      const metadata: BlogMetadata = {
        ...(originalData?.metadata ?? {}),
        blog_status: blogStatus,
        slug: slug || slugify(title),
        seo_keyword: targetKeyword || undefined,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        notes: notes || undefined,
        cluster,
      };

      if (blogStatus === 'published' && !metadata.published_date) {
        metadata.published_date = new Date().toISOString().split('T')[0];
      }

      await api.patch<ApiResponse<ApiBlogItem>>(`/content-items/${id}`, {
        title,
        body: body || null,
        status: dbStatus,
        scheduled_day: day,
        scheduled_month: month,
        scheduled_year: year,
        metadata,
      });

      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDirty(false);
      toast.success('Saved');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Publish handler ─────────────────────────────────────────

  async function handlePublish() {
    setBlogStatus('published');
    // Will be saved with the next save
    setTimeout(() => handleSave(), 0);
  }

  // ── Mark dirty on any change ────────────────────────────────

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  // ── AI generate handler ─────────────────────────────────────

  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await api.post<ApiResponse<{ output: { content: string } }>>('/skills/blog-planner', {
        niche: cluster || 'finance',
        keywords: targetKeyword ? [targetKeyword] : [title],
        audience: 'Australians looking for mid-credit or fair-credit personal and car loans',
      });
      if (res.success && res.data?.output?.content) {
        setBody(res.data.output.content);
        markDirty();
        toast.success('Draft generated');
      }
    } catch {
      toast.error('Generation failed — you can still write manually');
    } finally {
      setGenerating(false);
    }
  }

  // ── Keyboard shortcut ───────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Loading state ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sc = STATUS_CONFIG[blogStatus];
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/content-calendar')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Calendar
            </button>

            {cluster && (
              <Badge variant="outline" className="text-[9px] gap-1 font-normal">
                <Hash className="h-2.5 w-2.5" />
                {cluster}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status selector */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {BLOG_STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { setBlogStatus(s); markDirty(); }}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-medium transition-colors',
                      blogStatus === s
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted',
                      s !== 'planned' && 'border-l border-border',
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {lastSaved && (
              <span className="text-[10px] text-muted-foreground">
                Saved {lastSaved}
              </span>
            )}

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>

            {blogStatus !== 'published' && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handlePublish}
                disabled={saving || !body.trim()}
              >
                <Send className="h-3 w-3" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── Left: Editor ──────────────────────────────── */}
          <div className="space-y-6">
            {/* Title */}
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value));
                markDirty();
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Blog title..."
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none resize-none leading-tight placeholder:text-muted-foreground/40"
              rows={1}
            />

            {/* Slug preview */}
            <p className="text-[11px] text-muted-foreground -mt-4">
              /{slug || 'blog-slug'}
            </p>

            {/* Content editor */}
            <div className="relative">
              {!body && !generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10 py-16">
                  <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/50">Start writing your blog post...</p>
                  <p className="text-[10px] text-muted-foreground/30 mt-1">Or use AI to generate a first draft</p>
                </div>
              )}
              <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); markDirty(); }}
                placeholder=""
                className={cn(
                  'w-full min-h-[500px] bg-transparent border border-border/30 rounded-lg p-5 text-sm leading-relaxed outline-none resize-y',
                  'focus:border-primary/30 transition-colors',
                  'placeholder:text-transparent',
                )}
              />
            </div>

            {/* Word count + AI button */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {wordCount} words {wordCount > 0 && `· ~${Math.ceil(wordCount / 250)} min read`}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {generating ? 'Generating...' : 'Generate Blog Draft'}
              </Button>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Internal Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); markDirty(); }}
                placeholder="Notes for your team (not published)..."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          {/* ── Right: SEO & metadata panel ───────────────── */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', sc.color)} />
                <span className="text-sm font-medium">{sc.label}</span>
              </div>
              {scheduledDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Scheduled: {new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Scheduled date */}
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Publish Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => { setScheduledDate(e.target.value); markDirty(); }}
                className="text-xs"
              />
            </div>

            {/* SEO fields */}
            <div className="rounded-lg border border-border/50 p-4 space-y-4">
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SEO</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Target Keyword</label>
                <Input
                  value={targetKeyword}
                  onChange={(e) => { setTargetKeyword(e.target.value); markDirty(); }}
                  placeholder="e.g. fair credit score australia"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Meta Title</label>
                <Input
                  value={metaTitle}
                  onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }}
                  placeholder={title || 'Page title for search engines'}
                  className="text-xs"
                />
                <p className="text-[9px] text-muted-foreground tabular-nums">
                  {(metaTitle || title).length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Meta Description</label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }}
                  placeholder="Brief description for search results..."
                  rows={3}
                  className="text-xs"
                />
                <p className="text-[9px] text-muted-foreground tabular-nums">
                  {metaDescription.length}/155 characters
                </p>
              </div>

              {/* SERP preview */}
              {(metaTitle || title) && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Search preview</p>
                  <p className="text-[13px] text-blue-600 font-medium leading-tight truncate">
                    {metaTitle || title}
                  </p>
                  <p className="text-[11px] text-emerald-700 truncate">
                    financeone.com.au/blog/{slug}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {metaDescription || 'Add a meta description to preview how this will appear in search results.'}
                  </p>
                </div>
              )}
            </div>

            {/* Cluster info */}
            {cluster && (
              <div className="rounded-lg border border-border/50 p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cluster</p>
                <p className="text-sm font-medium">{cluster}</p>
                {originalData?.metadata?.cluster_goal && (
                  <p className="text-[11px] text-muted-foreground">{originalData.metadata.cluster_goal}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dirty indicator ─────────────────────────────────── */}
      {dirty && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg px-3 py-1.5 text-[11px] font-medium shadow-sm">
            <AlertCircle className="h-3 w-3" />
            Unsaved changes
            <button onClick={handleSave} className="underline ml-1">
              Save now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
