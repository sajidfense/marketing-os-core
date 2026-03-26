import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowLeft, Save, Send, Loader2, Sparkles, FileText, Search, Hash,
  Calendar, CheckCircle2, AlertCircle, XCircle, Wand2, BarChart3, Settings2,
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link2, type LucideIcon,
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
  blog_status?: string; cluster?: string; cluster_goal?: string; cluster_type?: string;
  slug?: string; seo_keyword?: string; platform?: string; scheduled_date?: string;
  meta_title?: string; meta_description?: string; notes?: string; published_date?: string;
  [key: string]: unknown;
}

interface ApiBlogItem {
  id: string; organization_id: string; title: string; content_type: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_day: number | null; scheduled_month: number | null; scheduled_year: number | null;
  body: string | null; metadata: BlogMetadata; created_at: string; updated_at: string;
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
//  SEO Analysis (works on HTML content)
// ══════════════════════════════════════════════════════════════

interface SeoCheckItem { id: string; label: string; passed: boolean; impact: 'high' | 'medium' | 'low'; detail?: string; }
interface SeoAnalysis { score: number; wordCount: number; keywordCount: number; keywordDensity: number; headingCount: { h1: number; h2: number; h3: number }; internalLinks: number; readabilityScore: number; checks: SeoCheckItem[]; }

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

function analyzeSeo(html: string, title: string, keyword: string, metaTitle: string, metaDescription: string): SeoAnalysis {
  const text = stripHtml(html).trim();
  const lowerText = text.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerKw = keyword.toLowerCase().trim();
  const words = text ? text.split(/\s+/) : [];
  const wordCount = words.length;

  let keywordCount = 0, keywordDensity = 0;
  if (lowerKw && text) {
    const escaped = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = lowerText.match(new RegExp(escaped, 'gi'));
    keywordCount = matches ? matches.length : 0;
    keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  }

  // Parse headings from HTML
  const headingCount = { h1: 0, h2: 0, h3: 0 };
  const h1s = html.match(/<h1[\s>]/gi); headingCount.h1 = h1s ? h1s.length : 0;
  const h2s = html.match(/<h2[\s>]/gi); headingCount.h2 = h2s ? h2s.length : 0;
  const h3s = html.match(/<h3[\s>]/gi); headingCount.h3 = h3s ? h3s.length : 0;

  // Links from HTML
  const linkMatches = html.match(/<a\s/gi);
  const internalLinks = linkMatches ? linkMatches.length : 0;

  // Readability
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const readabilityScore = Math.min(100, Math.max(0, Math.round(100 - (avgSentenceLength - 15) * 4)));

  const first100 = words.slice(0, 100).join(' ').toLowerCase();
  const kwInFirst100 = lowerKw ? first100.includes(lowerKw) : false;
  const kwInMeta = lowerKw ? (metaDescription || '').toLowerCase().includes(lowerKw) : false;
  const densityOk = keywordDensity >= 0.5 && keywordDensity <= 2.5;

  const checks: SeoCheckItem[] = [
    { id: 'kw-title', label: 'Keyword in title', passed: lowerKw ? lowerTitle.includes(lowerKw) : false, impact: 'high', detail: lowerKw ? (lowerTitle.includes(lowerKw) ? 'Found' : `"${keyword}" not in title`) : 'Set a target keyword' },
    { id: 'kw-intro', label: 'Keyword in first 100 words', passed: kwInFirst100, impact: 'high', detail: kwInFirst100 ? 'Found' : 'Add keyword early in content' },
    { id: 'kw-meta', label: 'Keyword in meta description', passed: kwInMeta, impact: 'medium', detail: kwInMeta ? 'Found' : 'Add keyword to meta description' },
    { id: 'kw-density', label: 'Keyword density (0.5–2.5%)', passed: densityOk && keywordCount > 0, impact: 'medium', detail: keywordCount > 0 ? `${keywordDensity.toFixed(1)}% (${keywordCount} uses)` : 'No keyword occurrences' },
    { id: 'length', label: 'Content length (800+ words)', passed: wordCount >= 800, impact: 'high', detail: `${wordCount} words${wordCount < 800 ? ` — need ${800 - wordCount} more` : ''}` },
    { id: 'headings', label: 'Headings structured (2+ H2s)', passed: headingCount.h2 >= 2, impact: 'medium', detail: `H1: ${headingCount.h1}, H2: ${headingCount.h2}, H3: ${headingCount.h3}` },
    { id: 'meta-title', label: 'Meta title (30–60 chars)', passed: (metaTitle || title).length >= 30 && (metaTitle || title).length <= 60, impact: 'medium', detail: `${(metaTitle || title).length} characters` },
    { id: 'meta-desc', label: 'Meta description (120–155 chars)', passed: metaDescription.length >= 120 && metaDescription.length <= 155, impact: 'medium', detail: metaDescription.length > 0 ? `${metaDescription.length} characters` : 'Not set' },
    { id: 'links', label: 'Internal links (2+ recommended)', passed: internalLinks >= 2, impact: 'low', detail: `${internalLinks} link${internalLinks !== 1 ? 's' : ''} detected` },
    { id: 'readability', label: 'Readable (avg. ≤20 words/sentence)', passed: avgSentenceLength <= 20 && avgSentenceLength > 0, impact: 'low', detail: sentences.length > 0 ? `Avg ${avgSentenceLength.toFixed(1)} words/sentence` : 'No sentences' },
  ];

  const weights: Record<string, number> = { high: 15, medium: 10, low: 5 };
  let maxScore = 0, earned = 0;
  for (const check of checks) { const w = weights[check.impact]; maxScore += w; if (check.passed) earned += w; }
  const score = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

  return { score, wordCount, keywordCount, keywordDensity, headingCount, internalLinks, readabilityScore, checks };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

// ── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2; const c = 2 * Math.PI * r;
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

function CheckItem({ check }: { check: SeoCheckItem }) {
  const Icon: LucideIcon = check.passed ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', check.passed ? 'text-emerald-500' : 'text-red-400')} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium">{check.label}</p>
        {check.detail && <p className="text-[10px] text-muted-foreground">{check.detail}</p>}
      </div>
      <Badge variant="outline" className={cn('text-[8px] shrink-0', check.impact === 'high' ? 'border-red-200 text-red-500' : check.impact === 'medium' ? 'border-amber-200 text-amber-500' : 'border-zinc-200 text-zinc-400')}>
        {check.impact}
      </Badge>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Toolbar Button
// ══════════════════════════════════════════════════════════════

function ToolbarBtn({ icon: Icon, active, onClick, title }: { icon: LucideIcon; active?: boolean; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground')}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
//  Blog Editor
// ══════════════════════════════════════════════════════════════

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [sideTab, setSideTab] = useState<'seo' | 'settings'>('seo');

  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('planned');
  const [slug, setSlug] = useState('');
  const [cluster, setCluster] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [originalData, setOriginalData] = useState<ApiBlogItem | null>(null);

  // ── TipTap Editor ─────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2 cursor-pointer' },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[450px] px-5 py-4 text-sm',
      },
    },
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      if (!dirty) setDirty(true);
    },
  });

  // ── SEO analysis (debounced) ──────────────────────────────
  const debouncedHtml = useDebounce(htmlContent, 400);
  const debouncedTitle = useDebounce(title, 400);
  const debouncedKeyword = useDebounce(targetKeyword, 400);
  const debouncedMetaTitle = useDebounce(metaTitle, 400);
  const debouncedMetaDesc = useDebounce(metaDescription, 400);

  const seo = useMemo(
    () => analyzeSeo(debouncedHtml, debouncedTitle, debouncedKeyword, debouncedMetaTitle, debouncedMetaDesc),
    [debouncedHtml, debouncedTitle, debouncedKeyword, debouncedMetaTitle, debouncedMetaDesc],
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
        const body = b.body ?? '';
        setHtmlContent(body);
        // Set editor content after it's ready
        setTimeout(() => { editor?.commands.setContent(body); }, 0);
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
    } finally { setLoading(false); }
  }, [id, navigate, editor]);

  useEffect(() => { if (editor) loadBlog(); }, [loadBlog, editor]);

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
        blog_status: blogStatus, slug: slug || slugify(title),
        seo_keyword: targetKeyword || undefined, meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined, notes: notes || undefined, cluster,
      };
      if (blogStatus === 'published' && !metadata.published_date) metadata.published_date = new Date().toISOString().split('T')[0];

      await api.patch<ApiResponse<ApiBlogItem>>(`/content-items/${id}`, {
        title, body: htmlContent || null, status: dbStatus,
        scheduled_day: day, scheduled_month: month, scheduled_year: year, metadata,
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDirty(false);
      toast.success('Saved');
    } catch (err) { toast.error(err instanceof ApiError ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  }

  function handlePublish() { setBlogStatus('published'); setTimeout(handleSave, 0); }
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
        const c = res.data.output.content;
        editor?.commands.setContent(c);
        setHtmlContent(c);
        markDirty();
        toast.success('Draft generated');
      }
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  }

  const [improving, setImproving] = useState(false);
  async function handleImprove() {
    if (!htmlContent.trim()) { toast.error('Write some content first'); return; }
    setImproving(true);
    try {
      const text = stripHtml(htmlContent).slice(0, 3000);
      const res = await api.post<ApiResponse<{ output: { content: string } }>>('/skills/blog-planner', {
        niche: cluster || 'finance',
        keywords: targetKeyword ? [targetKeyword, title] : [title],
        audience: `Rewrite for SEO. Target keyword: "${targetKeyword}". Add H2 headings, optimize keyword placement.\n\nContent:\n${text}`,
      });
      if (res.success && res.data?.output?.content) {
        const c = res.data.output.content;
        editor?.commands.setContent(c);
        setHtmlContent(c);
        markDirty();
        toast.success('Content improved');
      }
    } catch { toast.error('Improvement failed'); }
    finally { setImproving(false); }
  }

  // ── Link insertion ────────────────────────────────────────
  function insertLink() {
    const url = prompt('Enter URL:');
    if (!url) return;
    if (editor?.state.selection.empty) {
      editor?.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  // ── Keyboard shortcut ─────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (loading || !editor) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const sc = STATUS_CONFIG[blogStatus];
  const wcPct = Math.min((seo.wordCount / 1500) * 100, 100);
  const wcColor = seo.wordCount >= 1200 ? 'bg-emerald-500' : seo.wordCount >= 800 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/blogs')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Blogs
            </button>
            {cluster && <Badge variant="outline" className="text-[9px] gap-1 font-normal"><Hash className="h-2.5 w-2.5" />{cluster}</Badge>}
            <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tabular-nums',
              seo.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : seo.score >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500')}>
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
              <Button size="sm" className="gap-1.5 text-xs" onClick={handlePublish} disabled={saving || !htmlContent.trim()}>
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
          <div className="space-y-4">
            {/* Title */}
            <textarea value={title}
              onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)); markDirty(); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              placeholder="Blog title..."
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none resize-none leading-tight placeholder:text-muted-foreground/40"
              rows={1}
            />
            <p className="text-[11px] text-muted-foreground -mt-2">/{slug || 'blog-slug'}</p>

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 px-2 py-1 flex-wrap">
              <ToolbarBtn icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Cmd+B)" />
              <ToolbarBtn icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Cmd+I)" />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarBtn icon={Heading1} active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1" />
              <ToolbarBtn icon={Heading2} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" />
              <ToolbarBtn icon={Heading3} active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3" />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarBtn icon={List} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List" />
              <ToolbarBtn icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List" />
              <div className="w-px h-4 bg-border mx-1" />
              <ToolbarBtn icon={Link2} active={editor.isActive('link')} onClick={insertLink} title="Insert Link" />
              {editor.isActive('link') && (
                <button onClick={() => editor.chain().focus().unsetLink().run()} className="text-[10px] text-red-400 hover:text-red-500 ml-1">Remove link</button>
              )}
            </div>

            {/* TipTap Editor */}
            <div className="rounded-lg border border-border/30 bg-background focus-within:border-primary/30 transition-colors overflow-hidden">
              <EditorContent editor={editor} />
            </div>

            {/* Word count + AI buttons */}
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
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleImprove} disabled={improving || !htmlContent.trim()}>
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

          {/* ── Right: SEO + Settings ─────────────────────── */}
          <div className="space-y-4">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button onClick={() => setSideTab('seo')} className={cn('flex-1 px-3 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5', sideTab === 'seo' ? 'bg-foreground text-background' : 'hover:bg-muted')}>
                <BarChart3 className="h-3 w-3" /> SEO Analysis
              </button>
              <button onClick={() => setSideTab('settings')} className={cn('flex-1 px-3 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 border-l border-border', sideTab === 'settings' ? 'bg-foreground text-background' : 'hover:bg-muted')}>
                <Settings2 className="h-3 w-3" /> Settings
              </button>
            </div>

            {sideTab === 'seo' ? (
              <>
                {/* Score */}
                <div className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={seo.score} />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold">{seo.score >= 80 ? 'Great SEO' : seo.score >= 50 ? 'Needs work' : 'Poor SEO'}</p>
                      <p className="text-[10px] text-muted-foreground">{seo.checks.filter((c) => c.passed).length}/{seo.checks.length} checks passing</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Content', ok: seo.wordCount >= 800, pct: Math.min((seo.wordCount / 800) * 100, 100) },
                          { label: 'Keywords', ok: seo.keywordDensity >= 0.5 && seo.keywordDensity <= 2.5, pct: Math.min(seo.keywordDensity * 40, 100) },
                          { label: 'Readability', ok: true, pct: seo.readabilityScore },
                        ].map((m) => (
                          <div key={m.label}>
                            <p className="text-[8px] text-muted-foreground uppercase">{m.label}</p>
                            <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                              <div className={cn('h-full rounded-full', m.ok ? 'bg-emerald-500' : 'bg-red-400')} style={{ width: `${m.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyword density */}
                <div className="rounded-lg border border-border/50 p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword Density</p>
                  {targetKeyword ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold tabular-nums">{seo.keywordDensity.toFixed(1)}%</span>
                        <span className="text-[10px] text-muted-foreground">{seo.keywordCount} uses in {seo.wordCount} words</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', seo.keywordDensity >= 0.5 && seo.keywordDensity <= 2.5 ? 'bg-emerald-500' : seo.keywordDensity > 2.5 ? 'bg-red-500' : 'bg-amber-500')} style={{ width: `${Math.min(seo.keywordDensity * 20, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Too low</span><span className="text-emerald-500 font-medium">Ideal</span><span>Too high</span>
                      </div>
                    </div>
                  ) : <p className="text-[11px] text-muted-foreground">Set a target keyword to track density</p>}
                </div>

                {/* Metrics */}
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

                {/* Checklist */}
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO Checklist</p>
                  <div className="divide-y divide-border/30">
                    {seo.checks.map((check) => <CheckItem key={check.id} check={check} />)}
                  </div>
                </div>
              </>
            ) : (
              <>
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
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Publish Date</label>
                  <Input type="date" value={scheduledDate} onChange={(e) => { setScheduledDate(e.target.value); markDirty(); }} className="text-xs" />
                </div>
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
                    <Input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }} placeholder={title || 'Page title'} className="text-xs" />
                    <p className="text-[9px] text-muted-foreground tabular-nums">{(metaTitle || title).length}/60</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground">Meta Description</label>
                    <Textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }} placeholder="Brief description..." rows={3} className="text-xs" />
                    <p className="text-[9px] text-muted-foreground tabular-nums">{metaDescription.length}/155</p>
                  </div>
                  {(metaTitle || title) && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Search preview</p>
                      <p className="text-[13px] text-blue-600 font-medium leading-tight truncate">{metaTitle || title}</p>
                      <p className="text-[11px] text-emerald-700 truncate">financeone.com.au/blog/{slug}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{metaDescription || 'Add a meta description.'}</p>
                    </div>
                  )}
                </div>
                {cluster && (
                  <div className="rounded-lg border border-border/50 p-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cluster</p>
                    <p className="text-sm font-medium">{cluster}</p>
                    {originalData?.metadata?.cluster_goal && <p className="text-[11px] text-muted-foreground">{originalData.metadata.cluster_goal}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
