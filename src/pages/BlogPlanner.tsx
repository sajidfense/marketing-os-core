import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2, Copy, Download, Sparkles, ChevronRight } from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface BlogPost {
  title: string;
  slug: string;
  targetKeyword: string;
  searchIntent: string;
  outline: string[];
  estimatedWordCount: number;
  difficulty: string;
}

interface BlogPlanOutput {
  blogPosts: BlogPost[];
  contentCalendar: string;
  seoSuggestions: string[];
  internalLinkingStrategy: string;
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: BlogPlanOutput;
  tokensUsed: number;
  costEstimate: number;
}

export default function BlogPlanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlogPlanOutput | null>(null);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
    setResult(null);
    setExpandedPost(null);

    try {
      const res = await api.post<ApiResponse<SkillResult>>('/skills/blog-planner', {
        niche,
        keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
        audience: audience || undefined,
        goal: goal || undefined,
      });
      if (res.data?.output) {
        setResult(res.data.output);
        toast.success('Blog plan generated');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Generation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function handleExport() {
    if (!result) return;
    exportToCSV(
      result.blogPosts.map((p) => ({
        title: p.title,
        slug: p.slug,
        targetKeyword: p.targetKeyword,
        searchIntent: p.searchIntent,
        wordCount: p.estimatedWordCount,
        difficulty: p.difficulty,
        outline: p.outline.join(' | '),
      })),
      'blog-plan',
      [
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'Slug' },
        { key: 'targetKeyword', label: 'Target Keyword' },
        { key: 'searchIntent', label: 'Intent' },
        { key: 'wordCount', label: 'Word Count' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'outline', label: 'Outline' },
      ],
    );
    toast.success('Exported');
  }

  const difficultyVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
    easy: 'success',
    medium: 'warning',
    hard: 'destructive',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Blog Content Planner"
        description="AI-powered blog strategy with SEO-optimized topics"
        actions={
          result ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3 w-3" />
              Export
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Plan Settings</CardTitle>
            <CardDescription>Define your blog content strategy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Niche / Industry</label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. SaaS marketing" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Keywords (comma-separated)</label>
                <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. marketing automation, lead gen" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Audience (optional)</label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. B2B marketers" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Goal (optional)</label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. establish thought leadership" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading || !niche.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? 'Generating...' : 'Generate Blog Plan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Blog Posts */}
              {result.blogPosts.map((post, i) => (
                <Card
                  key={i}
                  className="cursor-pointer hover:border-primary/20 transition-all duration-200"
                  onClick={() => setExpandedPost(expandedPost === i ? null : i)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge variant={difficultyVariant[post.difficulty] ?? 'secondary'} className="text-[10px]">
                            {post.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{post.searchIntent}</Badge>
                          <span className="text-[10px] text-muted-foreground">{post.estimatedWordCount} words</span>
                        </div>
                        <h3 className="text-sm font-semibold leading-tight">{post.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: <span className="text-foreground/70">{post.targetKeyword}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(post.title); }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform ${expandedPost === i ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {expandedPost === i && post.outline.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outline</p>
                        <ol className="space-y-1.5">
                          {post.outline.map((section, j) => (
                            <li key={j} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className="text-muted-foreground tabular-nums shrink-0">{j + 1}.</span>
                              {section}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* SEO Suggestions + Strategy */}
              <div className="grid gap-4 sm:grid-cols-2">
                {result.seoSuggestions?.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO Suggestions</p>
                      <ul className="space-y-1.5">
                        {result.seoSuggestions.map((s, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                            <span className="text-primary mt-1 shrink-0">-</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Content Calendar</p>
                    <p className="text-xs text-foreground/80">{result.contentCalendar}</p>
                    {result.internalLinkingStrategy && (
                      <>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Internal Linking</p>
                        <p className="text-xs text-foreground/80">{result.internalLinkingStrategy}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">No blog plan generated yet</p>
                <p className="text-xs text-muted-foreground mt-1">Configure your niche and hit Generate</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
