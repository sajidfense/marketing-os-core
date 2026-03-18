import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  Download,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Target,
  Users,
  Lightbulb,
  ListChecks,
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

interface TechnicalIssue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  fix: string;
  impact: string;
}

interface ContentGap {
  title: string;
  description: string;
  suggestedAction: string;
  priority: string;
}

interface KeywordOpp {
  keyword: string;
  intent: string;
  difficulty: string;
  suggestedPage: string;
  action: string;
}

interface CompetitorSuggestion {
  strategy: string;
  description: string;
  expectedImpact: string;
}

interface ActionItem {
  priority: number;
  task: string;
  category: string;
  effort: string;
  impact: string;
}

interface SEOReportOutput {
  summary: {
    headline: string;
    overview: string;
    overallScore: number;
    grade: string;
  };
  technicalIssues: TechnicalIssue[];
  contentGaps: ContentGap[];
  keywordOpportunities: KeywordOpp[];
  competitorSuggestions: CompetitorSuggestion[];
  actionPlan: ActionItem[];
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: SEOReportOutput;
  tokensUsed: number;
  costEstimate: number;
}

// ── Score Ring ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] font-semibold text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Severity icon ─────────────────────────────────────────────────────

const severityIcon = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const severityBadge = {
  critical: 'destructive' as const,
  warning: 'warning' as const,
  info: 'secondary' as const,
};

const difficultyBadge = {
  easy: 'success' as const,
  medium: 'warning' as const,
  hard: 'destructive' as const,
};

const effortBadge: Record<string, 'success' | 'warning' | 'destructive'> = {
  'quick-win': 'success',
  moderate: 'warning',
  significant: 'destructive',
};

// ── Loading skeleton ──────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function SEOReportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOReportOutput | null>(null);

  async function handleGenerate(e: FormEvent) {
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
      const res = await api.post<ApiResponse<SkillResult>>('/seo/report', {
        url: normalized,
        keyword: keyword.trim() || undefined,
      });

      if (res.success && res.data?.output) {
        setResult(res.data.output);
        toast.success('SEO report generated');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Report generation failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleExportIssues() {
    if (!result) return;
    exportToCSV(
      result.technicalIssues.map((i) => ({
        severity: i.severity,
        title: i.title,
        description: i.description,
        fix: i.fix,
        impact: i.impact,
      })),
      `seo-report-issues-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'severity', label: 'Severity' },
        { key: 'title', label: 'Issue' },
        { key: 'description', label: 'Description' },
        { key: 'fix', label: 'Fix' },
        { key: 'impact', label: 'Impact' },
      ],
    );
    toast.success('Issues exported');
  }

  function handleExportPlan() {
    if (!result) return;
    exportToCSV(
      result.actionPlan.map((a) => ({
        priority: a.priority,
        task: a.task,
        category: a.category,
        effort: a.effort,
        impact: a.impact,
      })),
      `seo-action-plan-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'priority', label: 'Priority' },
        { key: 'task', label: 'Task' },
        { key: 'category', label: 'Category' },
        { key: 'effort', label: 'Effort' },
        { key: 'impact', label: 'Impact' },
      ],
    );
    toast.success('Action plan exported');
  }

  function handleAddToPlan() {
    if (!result) return;
    const tasks = result.actionPlan.map((a, i) => ({
      id: `report-${Date.now()}-${i}`,
      title: a.task,
      category: (a.category === 'technical' || a.category === 'on-page' || a.category === 'content' || a.category === 'off-page')
        ? a.category
        : 'on-page',
      priority: a.priority <= 2 ? 'high' : a.priority <= 4 ? 'medium' : 'low',
      status: 'todo',
      impact: a.impact,
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
        title="SEO Report Generator"
        description="Generate comprehensive SEO reports with technical analysis, content gaps, and keyword opportunities"
        actions={
          result ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportIssues} className="gap-2">
                <Download className="h-3 w-3" />
                Export Issues
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPlan} className="gap-2">
                <Download className="h-3 w-3" />
                Export Plan
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
            <FileText className="h-4 w-4 text-primary" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Enter a URL and optional target keyword for a full SEO report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="https://example.com"
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
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <ReportSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={result.summary.overallScore} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <h2 className="text-lg font-bold">{result.summary.headline}</h2>
                    <Badge variant="outline" className="text-xs font-bold">
                      Grade {result.summary.grade}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary.overview}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Issues */}
          {result.technicalIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h2 className="text-base font-semibold">Technical Issues ({result.technicalIssues.length})</h2>
              </div>
              <div className="space-y-2">
                {result.technicalIssues.map((issue, i) => {
                  const Icon = severityIcon[issue.severity];
                  return (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                            issue.severity === 'critical' ? 'text-red-400' : issue.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{issue.title}</p>
                              <Badge variant={severityBadge[issue.severity]} className="text-[9px]">{issue.severity}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{issue.description}</p>
                            <p className="text-xs"><span className="text-emerald-400 font-medium">Fix:</span> {issue.fix}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Gaps */}
          {result.contentGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-purple-400" />
                <h2 className="text-base font-semibold">Content Gaps ({result.contentGaps.length})</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.contentGaps.map((gap, i) => (
                  <Card key={i} className="hover:border-purple-500/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium">{gap.title}</p>
                        <Badge variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'warning' : 'secondary'} className="text-[9px]">
                          {gap.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{gap.description}</p>
                      <p className="text-xs text-primary"><span className="font-medium">Action:</span> {gap.suggestedAction}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Opportunities */}
          {result.keywordOpportunities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-cyan-400" />
                  Keyword Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword</th>
                        <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Intent</th>
                        <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                        <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.keywordOpportunities.map((kw, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-medium">{kw.keyword}</td>
                          <td className="py-3 text-center">
                            <Badge variant="outline" className="text-[9px]">{kw.intent}</Badge>
                          </td>
                          <td className="py-3 text-center">
                            <Badge variant={difficultyBadge[kw.difficulty as keyof typeof difficultyBadge] ?? 'secondary'} className="text-[9px]">
                              {kw.difficulty}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">{kw.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor Suggestions */}
          {result.competitorSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base font-semibold">Competitor Strategies</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.competitorSuggestions.map((sug, i) => (
                  <Card key={i} className="hover:border-indigo-500/20 transition-colors">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-1">{sug.strategy}</p>
                      <p className="text-xs text-muted-foreground mb-2">{sug.description}</p>
                      <p className="text-xs text-emerald-400">
                        <span className="font-medium">Impact:</span> {sug.expectedImpact}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan */}
          {result.actionPlan.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-base font-semibold">Action Plan</h2>
                </div>
                <Button size="sm" onClick={handleAddToPlan} className="gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Send to SEO Plan
                </Button>
              </div>
              <div className="space-y-2">
                {result.actionPlan
                  .sort((a, b) => a.priority - b.priority)
                  .map((action, i) => (
                    <Card key={i} className="hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {action.priority}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{action.task}</p>
                              <Badge variant="outline" className="text-[9px]">{action.category}</Badge>
                              <Badge variant={effortBadge[action.effort] ?? 'secondary'} className="text-[9px]">
                                {action.effort}
                              </Badge>
                            </div>
                            <p className="text-xs text-emerald-400">
                              <span className="font-medium">Impact:</span> {action.impact}
                            </p>
                          </div>
                        </div>
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
