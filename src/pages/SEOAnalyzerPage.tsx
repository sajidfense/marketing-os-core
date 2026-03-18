import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  SearchCheck,
  Loader2,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────

interface SEOIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  fix: string;
}

interface SEORecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
}

interface BreakdownItem {
  score: number;
  status: 'good' | 'warning' | 'critical';
  detail: string;
}

interface SEOAnalysisOutput {
  score: number;
  grade: string;
  summary: string;
  issues: SEOIssue[];
  recommendations: SEORecommendation[];
  breakdown: Record<string, BreakdownItem>;
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: SEOAnalysisOutput;
  tokensUsed: number;
  costEstimate: number;
}

// ── Score Ring ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const grade =
    score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--border))" strokeWidth="8"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-xs font-semibold text-muted-foreground">Grade {grade}</span>
      </div>
    </div>
  );
}

// ── Severity helpers ──────────────────────────────────────────────────

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', badge: 'destructive' as const },
  warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', badge: 'warning' as const },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', badge: 'secondary' as const },
};

const priorityBadge = {
  high: 'destructive' as const,
  medium: 'warning' as const,
  low: 'secondary' as const,
};

const statusConfig = {
  good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

// ── Loading skeleton ──────────────────────────────────────────────────

function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="h-[120px] w-[120px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function SEOAnalyzerPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOAnalysisOutput | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [copiedFix, setCopiedFix] = useState<string | null>(null);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    let normalized = trimmed;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    try {
      new URL(normalized);
    } catch {
      toast.error('Please enter a valid URL.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post<ApiResponse<SkillResult>>('/seo/analyze', {
        url: normalized,
        keyword: keyword.trim() || undefined,
      });

      if (res.success && res.data?.output) {
        setResult(res.data.output);
        setAnalyzedUrl(normalized);
        toast.success('SEO analysis complete');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Analysis failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!result) return;
    const rows = result.issues.map((issue) => ({
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      description: issue.description,
      fix: issue.fix,
    }));
    exportToCSV(rows, `seo-analysis-${new Date().toISOString().split('T')[0]}`, [
      { key: 'severity', label: 'Severity' },
      { key: 'category', label: 'Category' },
      { key: 'title', label: 'Issue' },
      { key: 'description', label: 'Description' },
      { key: 'fix', label: 'Fix' },
    ]);
    toast.success('Exported to CSV');
  }

  function copyFix(fix: string, key: string) {
    navigator.clipboard.writeText(fix);
    setCopiedFix(key);
    setTimeout(() => setCopiedFix(null), 2000);
  }

  function handleAddToPlan() {
    if (!result) return;
    // Store recommendations in sessionStorage for SEO Plan to pick up
    const tasks = result.recommendations.map((r, i) => ({
      id: `seo-${Date.now()}-${i}`,
      title: r.title,
      category: 'on-page' as const,
      priority: r.priority,
      status: 'todo' as const,
      impact: r.impact,
    }));
    const existing = sessionStorage.getItem('seo-plan-tasks');
    const prev = existing ? JSON.parse(existing) : [];
    sessionStorage.setItem('seo-plan-tasks', JSON.stringify([...prev, ...tasks]));
    toast.success(`${tasks.length} tasks added to SEO Plan`);
    navigate('/seo-plan');
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="SEO Analyzer"
        description="Deep on-page SEO audit powered by AI — scores, issues, and actionable fixes"
        actions={
          result ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
              <Button size="sm" onClick={handleAddToPlan} className="gap-2">
                <ArrowRight className="h-3 w-3" />
                Add to SEO Plan
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SearchCheck className="h-4 w-4 text-primary" />
            Analyze a Page
          </CardTitle>
          <CardDescription>Enter any public URL for a comprehensive on-page SEO audit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1"
              required
            />
            <Input
              type="text"
              placeholder="Target keyword (optional)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={loading}
              className="sm:w-56"
            />
            <Button type="submit" disabled={loading || !url.trim()} className="gap-2 shrink-0">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <AnalysisSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Score + Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={result.score} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                    <h2 className="text-lg font-bold">SEO Health Score</h2>
                    <a
                      href={analyzedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      {new URL(analyzedUrl).hostname}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Grid */}
          {result.breakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(result.breakdown).map(([key, item]) => {
                const sc = statusConfig[item.status];
                return (
                  <Card key={key} className={`p-3 border ${sc.bg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-bold tabular-nums ${sc.color}`}>{item.score}</span>
                      <span className="text-[10px] text-muted-foreground">/100</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.detail}</p>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3">
                Issues Found ({result.issues.length})
              </h2>
              <div className="space-y-2">
                {result.issues.map((issue, i) => {
                  const cfg = severityConfig[issue.severity];
                  const Icon = cfg.icon;
                  return (
                    <Card key={i} className={`border ${cfg.bg}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{issue.title}</p>
                              <Badge variant={cfg.badge} className="text-[9px]">{issue.severity}</Badge>
                              <Badge variant="outline" className="text-[9px]">{issue.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
                            <div className="flex items-start gap-2 rounded-lg bg-background/50 border border-border/50 p-2.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-foreground/80 flex-1">{issue.fix}</p>
                              <button
                                onClick={() => copyFix(issue.fix, `fix-${i}`)}
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedFix === `fix-${i}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">
                  Recommendations ({result.recommendations.length})
                </h2>
                <Button variant="outline" size="sm" onClick={handleAddToPlan} className="gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Add All to SEO Plan
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.recommendations.map((rec, i) => (
                  <Card key={i} className="hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={priorityBadge[rec.priority]} className="text-[9px]">{rec.priority}</Badge>
                        <Badge variant="outline" className="text-[9px]">{rec.effort}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                      <p className="text-xs text-emerald-400">
                        <span className="font-medium">Impact:</span> {rec.impact}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
