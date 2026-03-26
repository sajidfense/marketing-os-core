import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  XCircle,
  Minus,
  type LucideIcon,
  Wand2,
  BarChart3,
  Settings2,
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

const STATUS_CONFIG: Record<BlogStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-zinc-500' },
  draft: { label: 'Draft', color: 'bg-amber-500' },
  ready: { label: 'Ready', color: 'bg-blue-500' },
  published: { label: 'Published', color: 'bg-emerald-500' },
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');
}

// ══════════════════════════════════════════════════════════════
//  SEO Analysis Engine (debounced, pure logic)
// ══════════════════════════════════════════════════════════════

interface SeoCheckItem {
  id: string;
  label: string;
  passed: boolean;
  impact: 'high' | 'medium' | 'low';
  detail?: string;
}

interface SeoAnalysis {
  score: number;
  wordCount: number;
  keywordCount: number;
  keywordDensity: number;
  headingCount: { h1: number; h2: number; h3: number };
  internalLinks: number;
  avgSentenceLength: number;
  readabilityScore: number;
  checks: SeoCheckItem[];
}

function analyzeSeo(
  body: string,
  title: string,
  keyword: string,
  metaTitle: string,
  metaDescription: string,
): SeoAnalysis {
  const text = body.trim();
  const lowerText = text.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerKw = keyword.toLowerCase().trim();
  const words = text ? text.split(/\s+/) : [];
  const wordCount = words.length;

  // Keyword occurrences
  let keywordCount = 0;
  let keywordDensity = 0;
  if (lowerKw && text) {
    const escaped = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = lowerText.match(new RegExp(escaped, 'gi'));
    keywordCount = matches ? matches.length : 0;
    keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  }

  // Headings (markdown-style)
  const lines = text.split('\n');
  const headingCount = { h1: 0, h2: 0, h3: 0 };
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('### ')) headingCount.h3++;
    else if (trimmed.startsWith('## ')) headingCount.h2++;
    else if (trimmed.startsWith('# ')) headingCount.h1++;
  }

  // Internal links (markdown [text](url) or bare URLs containing financeone)
  const linkMatches = text.match(/\[.*?\]\(.*?\)|https?:\/\/[^\s)]+financeone[^\s)]*/gi);
  const internalLinks = linkMatches ? linkMatches.length : 0;

  // Readability (average sentence length)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  // Flesch-like readability: shorter sentences = higher score
  const readabilityScore = Math.min(100, Math.max(0, Math.round(100 - (avgSentenceLength - 15) * 4)));

  // Keyword in first 100 words
  const first100 = words.slice(0, 100).join(' ').toLowerCase();
  const kwInFirst100 = lowerKw ? first100.includes(lowerKw) : false;

  // ── Build checks ──────────────────────────────────────────
  const checks: SeoCheckItem[] = [];

  // 1. Keyword in title
  checks.push({
    id: 'kw-title',
    label: 'Keyword in title',
    passed: lowerKw ? lowerTitle.includes(lowerKw) : false,
    impact: 'high',
    detail: lowerKw ? (lowerTitle.includes(lowerKw) ? 'Found' : `"${keyword}" not found in title`) : 'Set a target keyword',
  });

  // 2. Keyword in first 100 words
  checks.push({
    id: 'kw-intro',
    label: 'Keyword in first 100 words',
    passed: kwInFirst100,
    impact: 'high',
    detail: kwInFirst100 ? 'Found in introduction' : 'Add keyword early in the content',
  });

  // 3. Keyword in meta description
  const kwInMeta = lowerKw ? (metaDescription || '').toLowerCase().includes(lowerKw) : false;
  checks.push({
    id: 'kw-meta',
    label: 'Keyword in meta description',
    passed: kwInMeta,
    impact: 'medium',
    detail: kwInMeta ? 'Found' : 'Include keyword in meta description',
  });

  // 4. Keyword density
  const densityOk = keywordDensity >= 0.5 && keywordDensity <= 2.5;
  checks.push({
    id: 'kw-density',
    label: 'Keyword density (0.5–2.5%)',
    passed: densityOk && keywordCount > 0,
    impact: 'medium',
    detail: keywordCount > 0 ? `${keywordDensity.toFixed(1)}% (${keywordCount} uses)` : 'No keyword occurrences',
  });

  // 5. Content length
  const lengthOk = wordCount >= 800;
  checks.push({
    id: 'length',
    label: 'Content length (800+ words)',
    passed: lengthOk,
    impact: 'high',
    detail: `${wordCount} words${wordCount < 800 ? ` — need ${800 - wordCount} more` : ''}`,
  });

  // 6. Headings structure
  const headingsOk = headingCount.h2 >= 2;
  checks.push({
    id: 'headings',
    label: 'Headings structured (2+ H2s)',
    passed: headingsOk,
    impact: 'medium',
    detail: `H1: ${headingCount.h1}, H2: ${headingCount.h2}, H3: ${headingCount.h3}`,
  });

  // 7. Meta title length
  const mtLen = (metaTitle || title).length;
  const metaTitleOk = mtLen >= 30 && mtLen <= 60;
  checks.push({
    id: 'meta-title',
    label: 'Meta title (30–60 chars)',
    passed: metaTitleOk,
    impact: 'medium',
    detail: `${mtLen} characters`,
  });

  // 8. Meta description length
  const mdLen = metaDescription.length;
  const metaDescOk = mdLen >= 120 && mdLen <= 155;
  checks.push({
    id: 'meta-desc',
    label: 'Meta description (120–155 chars)',
    passed: metaDescOk,
    impact: 'medium',
    detail: mdLen > 0 ? `${mdLen} characters` : 'Not set',
  });

  // 9. Internal links
  const linksOk = internalLinks >= 2;
  checks.push({
    id: 'links',
    label: 'Internal links (2+ recommended)',
    passed: linksOk,
    impact: 'low',
    detail: `${internalLinks} link${internalLinks !== 1 ? 's' : ''} detected`,
  });

  // 10. Readability
  const readOk = avgSentenceLength <= 20 && avgSentenceLength > 0;
  checks.push({
    id: 'readability',
    label: 'Readable (avg. ≤20 words/sentence)',
    passed: readOk,
    impact: 'low',
    detail: sentences.length > 0 ? `Avg ${avgSentenceLength.toFixed(1)} words/sentence` : 'No sentences',
  });

  // ── Compute score ──────────────────────────────────────────
  const weights: Record<string, number> = { high: 15, medium: 10, low: 5 };
  let maxScore = 0;
  let earned = 0;
  for (const check of checks) {
    const w = weights[check.impact];
    maxScore += w;
    if (check.passed) earned += w;
  }
  const score = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

  return { score, wordCount, keywordCount, keywordDensity, headingCount, internalLinks, avgSentenceLength, readabilityScore, checks };
}

// ── Debounce hook ──────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">SEO</span>
      </div>
    </div>
  );
}

// ── Check item component ───────────────────────────────────────
function CheckItem({ check }: { check: SeoCheckItem }) {
  const Icon: LucideIcon = check.passed ? CheckCircle2 : XCircle;
  const color = check.passed ? 'text-emerald-500' : 'text-red-400';
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium">{check.label}</p>
        {check.detail && (
          <p className="text-[10px] text-muted-foreground">{check.detail}</p>
        )}
      </div>
      <Badge variant="outline" className={cn('text-[8px] shrink-0', check.impact === 'high' ? 'border-red-200 text-red-500' : check.impact === 'medium' ? 'border-amber-200 text-amber-500' : 'border-zinc-200 text-zinc-400')}>
        {check.impact}
      </Badge>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Blog Editor Component
// ══════════════════════════════════════════════════════════════

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [sideTab, setSideTab] = useState<'seo' | 'settings'>('seo');

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

  // ── SEO analysis (debounced 400ms) ────────────────────────
  const debouncedBody = useDebounce(body, 400);
  const debouncedTitle = useDebounce(title, 400);
  const debouncedKeyword = useDebounce(targetKeyword, 400);
  const debouncedMetaTitle = useDebounce(metaTitle, 400);
  const debouncedMetaDesc = useDebounce(metaDescription, 400);

  const seo = useMemo(
    () => analyzeSeo(debouncedBody, debouncedTitle, debouncedKeyword, debouncedMetaTitle, debouncedMetaDesc),
    [debouncedBody, debouncedTitle, debouncedKeyword, debouncedMetaTitle, debouncedMetaDesc],
  );

  // ── Load blog data ────────────────────────────────────────
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
          setScheduledDate(`${b.scheduled_year}-${String(b.scheduled_month).padStart(2, '0')}-${String(b.scheduled_day).padStart(2, '0')}`);
        }
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load blog');
      navigate('/content-calendar');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadBlog(); }, [loadBlog]);

  // ── Save ──────────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { toast.error('Title cannot be empty'); return; }
    setSaving(true);
    try {
      const [year, month, day] = scheduledDate
        ? scheduledDate.split('-').map(Number)
        : [originalData?.scheduled_year, originalData?.scheduled_month, originalData?.scheduled_day];

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
        title, body: body || null, status: dbStatus,
        scheduled_day: day, scheduled_month: month, scheduled_year: year, metadata,
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDirty(false);
      toast.success('Saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  function handlePublish() { setBlogStatus('published'); setTimeout(() => handleSave(), 0); }
  function markDirty() { if (!dirty) setDirty(true); }

  // ── AI generate ───────────────────────────────────────────
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
        setBody(res.data.output.content); markDirty(); toast.success('Draft generated');
      }
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  }

  // ── AI SEO improve ────────────────────────────────────────
  const [improving, setImproving] = useState(false);
  async function handleImprove() {
    if (!body.trim()) { toast.error('Write some content first'); return; }
    setImproving(true);
    try {
      const res = await api.post<ApiResponse<{ output: { content: string } }>>('/skills/blog-planner', {
        niche: cluster || 'finance',
        keywords: targetKeyword ? [targetKeyword, title] : [title],
        audience: `Rewrite/improve this blog for SEO. Target keyword: "${targetKeyword}". Maintain the same meaning but optimize for search engines. Add H2 headings, improve keyword placement, and ensure readability.\n\nCurrent content:\n${body.slice(0, 3000)}`,
      });
      if (res.success && res.data?.output?.content) {
        setBody(res.data.output.content); markDirty(); toast.success('Content improved for SEO');
      }
    } catch { toast.error('Improvement failed'); }
    finally { setImproving(false); }
  }

  // ── Keyboard shortcut ─────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const sc = STATUS_CONFIG[blogStatus];

  // Word count bar segments
  const wcPct = Math.min((seo.wordCount / 1500) * 100, 100);
  const wcColor = seo.wordCount >= 1200 ? 'bg-emerald-500' : seo.wordCount >= 800 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/content-calendar')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Calendar
            </button>
            {cluster && (
              <Badge variant="outline" className="text-[9px] gap-1 font-normal">
                <Hash className="h-2.5 w-2.5" />{cluster}
              </Badge>
            )}
            {/* Live SEO score pill */}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tabular-nums',
              seo.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : seo.score >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500',
            )}>
              <BarChart3 className="h-3 w-3" /> SEO {seo.score}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              {BLOG_STATUSES.map((s) => (
                <button key={s} onClick={() => { setBlogStatus(s); markDirty(); }}
                  className={cn('px-2.5 py-1 text-[10px] font-medium transition-colors', blogStatus === s ? 'bg-foreground text-background' : 'hover:bg-muted', s !== 'planned' && 'border-l border-border')}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
            {lastSaved && <span className="text-[10px] text-muted-foreground">Saved {lastSaved}</span>}
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
            </Button>
            {blogStatus !== 'published' && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={handlePublish} disabled={saving || !body.trim()}>
                <Send className="h-3 w-3" /> Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* ── Left: Editor ──────────────────────────────── */}
          <div className="space-y-6">
            <textarea
              ref={titleRef} value={title}
              onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)); markDirty(); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              placeholder="Blog title..."
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none resize-none leading-tight placeholder:text-muted-foreground/40"
              rows={1}
            />
            <p className="text-[11px] text-muted-foreground -mt-4">/{slug || 'blog-slug'}</p>

            <div className="relative">
              {!body && !generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10 py-16">
                  <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/50">Start writing your blog post...</p>
                  <p className="text-[10px] text-muted-foreground/30 mt-1">Use ## for H2 headings, ### for H3</p>
                </div>
              )}
              <textarea value={body} onChange={(e) => { setBody(e.target.value); markDirty(); }} placeholder=""
                className={cn('w-full min-h-[500px] bg-transparent border border-border/30 rounded-lg p-5 text-sm leading-relaxed outline-none resize-y font-mono', 'focus:border-primary/30 transition-colors')}
              />
            </div>

            {/* Word count bar + AI buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                  {seo.wordCount} words {seo.wordCount > 0 && `· ~${Math.ceil(seo.wordCount / 250)} min`}
                </span>
                <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', wcColor)} style={{ width: `${wcPct}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground">Target: 800–1500</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {generating ? 'Generating...' : 'Generate Draft'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleImprove} disabled={improving || !body.trim()}>
                  {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  {improving ? 'Improving...' : 'Improve SEO'}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Internal Notes</label>
              <Textarea value={notes} onChange={(e) => { setNotes(e.target.value); markDirty(); }} placeholder="Notes for your team..." rows={3} className="text-xs" />
            </div>
          </div>

          {/* ── Right: SEO Analysis + Settings ────────────── */}
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex rounded-md border border-border overflow-hidden">
              <button onClick={() => setSideTab('seo')}
                className={cn('flex-1 px-3 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5', sideTab === 'seo' ? 'bg-foreground text-background' : 'hover:bg-muted')}>
                <BarChart3 className="h-3 w-3" /> SEO Analysis
              </button>
              <button onClick={() => setSideTab('settings')}
                className={cn('flex-1 px-3 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 border-l border-border', sideTab === 'settings' ? 'bg-foreground text-background' : 'hover:bg-muted')}>
                <Settings2 className="h-3 w-3" /> Settings
              </button>
            </div>

            {sideTab === 'seo' ? (
              <>
                {/* ── Score ring ──────────────────────────── */}
                <div className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={seo.score} />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold">
                        {seo.score >= 80 ? 'Great SEO' : seo.score >= 50 ? 'Needs work' : 'Poor SEO'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {seo.checks.filter((c) => c.passed).length}/{seo.checks.length} checks passing
                      </p>
                      {/* Mini bars */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Content</p>
                          <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                            <div className={cn('h-full rounded-full', seo.wordCount >= 800 ? 'bg-emerald-500' : 'bg-red-400')} style={{ width: `${Math.min((seo.wordCount / 800) * 100, 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Keywords</p>
                          <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                            <div className={cn('h-full rounded-full', seo.keywordDensity >= 0.5 && seo.keywordDensity <= 2.5 ? 'bg-emerald-500' : 'bg-red-400')} style={{ width: `${Math.min(seo.keywordDensity * 40, 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Readability</p>
                          <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${seo.readabilityScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Keyword density ─────────────────────── */}
                <div className="rounded-lg border border-border/50 p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword Density</p>
                  {targetKeyword ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold tabular-nums">{seo.keywordDensity.toFixed(1)}%</span>
                        <span className="text-[10px] text-muted-foreground">{seo.keywordCount} uses in {seo.wordCount} words</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all',
                            seo.keywordDensity >= 0.5 && seo.keywordDensity <= 2.5 ? 'bg-emerald-500' :
                            seo.keywordDensity > 2.5 ? 'bg-red-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${Math.min(seo.keywordDensity * 20, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Too low (&lt;0.5%)</span>
                        <span className="text-emerald-500 font-medium">Ideal (0.5–2.5%)</span>
                        <span>Too high (&gt;2.5%)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Set a target keyword to track density</p>
                  )}
                </div>

                {/* ── Content metrics ─────────────────────── */}
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Content Metrics</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Words', value: seo.wordCount, target: '800+', ok: seo.wordCount >= 800 },
                      { label: 'Headings', value: seo.headingCount.h2 + seo.headingCount.h3, target: '2+', ok: seo.headingCount.h2 >= 2 },
                      { label: 'Links', value: seo.internalLinks, target: '2+', ok: seo.internalLinks >= 2 },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className={cn('text-lg font-bold tabular-nums', m.ok ? 'text-emerald-500' : 'text-muted-foreground')}>{m.value}</p>
                        <p className="text-[9px] text-muted-foreground">{m.label} ({m.target})</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Checklist ───────────────────────────── */}
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO Checklist</p>
                  <div className="divide-y divide-border/30">
                    {seo.checks.map((check) => <CheckItem key={check.id} check={check} />)}
                  </div>
                </div>
              </>
            ) : (
              /* ── Settings tab ────────────────────────────── */
              <>
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
                      {new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Scheduled date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Publish Date</label>
                  <Input type="date" value={scheduledDate} onChange={(e) => { setScheduledDate(e.target.value); markDirty(); }} className="text-xs" />
                </div>

                {/* SEO fields */}
                <div className="rounded-lg border border-border/50 p-4 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SEO Fields</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground">Target Keyword</label>
                    <Input value={targetKeyword} onChange={(e) => { setTargetKeyword(e.target.value); markDirty(); }} placeholder="e.g. fair credit score australia" className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground">Meta Title</label>
                    <Input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }} placeholder={title || 'Page title for search engines'} className="text-xs" />
                    <p className="text-[9px] text-muted-foreground tabular-nums">{(metaTitle || title).length}/60</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground">Meta Description</label>
                    <Textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }} placeholder="Brief description for search results..." rows={3} className="text-xs" />
                    <p className="text-[9px] text-muted-foreground tabular-nums">{metaDescription.length}/155</p>
                  </div>

                  {/* SERP preview */}
                  {(metaTitle || title) && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Search preview</p>
                      <p className="text-[13px] text-blue-600 font-medium leading-tight truncate">{metaTitle || title}</p>
                      <p className="text-[11px] text-emerald-700 truncate">financeone.com.au/blog/{slug}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {metaDescription || 'Add a meta description to see preview.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cluster */}
                {cluster && (
                  <div className="rounded-lg border border-border/50 p-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cluster</p>
                    <p className="text-sm font-medium">{cluster}</p>
                    {originalData?.metadata?.cluster_goal && (
                      <p className="text-[11px] text-muted-foreground">{originalData.metadata.cluster_goal}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Dirty indicator ─────────────────────────────────── */}
      {dirty && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg px-3 py-1.5 text-[11px] font-medium shadow-sm">
            <AlertCircle className="h-3 w-3" /> Unsaved changes
            <button onClick={handleSave} className="underline ml-1">Save now</button>
          </div>
        </div>
      )}
    </div>
  );
}
