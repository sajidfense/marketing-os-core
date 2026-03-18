import { useState, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SearchCheck, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface CWVMetric {
  displayValue: string;
  score: number | null;
  numericValue: number | null;
}

interface ScoresData {
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  cwv: {
    lcp: CWVMetric;
    inp: CWVMetric;
    cls: CWVMetric;
    fcp: CWVMetric;
    ttfb: CWVMetric;
  };
}

type LoadingStage = 'idle' | 'fetching' | 'analysing' | 'streaming';

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreBgClass(score: number): string {
  if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Critical';
}

function cwvStatus(score: number | null): { label: string; className: string } {
  if (score === null) return { label: 'N/A', className: 'text-muted-foreground bg-muted' };
  if (score >= 0.9) return { label: 'FAST', className: 'text-emerald-400 bg-emerald-500/10' };
  if (score >= 0.5) return { label: 'MODERATE', className: 'text-amber-400 bg-amber-500/10' };
  return { label: 'SLOW', className: 'text-red-400 bg-red-500/10' };
}

function stageLabel(stage: LoadingStage): string {
  switch (stage) {
    case 'fetching':  return 'Fetching Core Web Vitals';
    case 'analysing': return 'Scanning on-page SEO';
    case 'streaming': return 'Generating AI report';
    default:          return '';
  }
}

function ScoreDial({ label, score }: { label: string; score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${scoreBgClass(score)}`}>
      <div className="relative flex items-center justify-center">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <span className="absolute text-xl font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      <p className="text-sm font-medium">{label}</p>
      <span className="text-xs text-muted-foreground">{scoreLabel(score)}</span>
    </div>
  );
}

function CWVCard({ label, abbr, metric, target }: { label: string; abbr: string; metric: CWVMetric; target: string }) {
  const status = cwvStatus(metric.score);
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{abbr}</p>
          <p className="text-[10px] text-muted-foreground/60">{label}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${status.className}`}>{status.label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{metric.displayValue}</p>
      <p className="text-[10px] text-muted-foreground/60">Target: {target}</p>
    </div>
  );
}

export default function SEOAnalyser() {
  const [url, setUrl] = useState('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [scores, setScores] = useState<ScoresData | null>(null);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = loadingStage !== 'idle';

  async function handleAnalyse(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        toast.error('Please enter a valid http or https URL.');
        return;
      }
    } catch {
      toast.error('Please enter a valid URL (e.g. https://example.com).');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setReport('');
    setScores(null);
    setLoadingStage('fetching');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/seo/analyse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errorBody.error ?? `Request failed: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body received.');

      setLoadingStage('analysing');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          try {
            const event = JSON.parse(raw) as {
              type: string;
              content?: string;
              message?: string;
              performanceScore?: number;
              seoScore?: number;
              accessibilityScore?: number;
              cwv?: ScoresData['cwv'];
            };

            if (event.type === 'scores') {
              setScores({
                performanceScore: event.performanceScore ?? 0,
                seoScore: event.seoScore ?? 0,
                accessibilityScore: event.accessibilityScore ?? 0,
                cwv: event.cwv ?? {
                  lcp: { displayValue: 'N/A', score: null, numericValue: null },
                  inp: { displayValue: 'N/A', score: null, numericValue: null },
                  cls: { displayValue: 'N/A', score: null, numericValue: null },
                  fcp: { displayValue: 'N/A', score: null, numericValue: null },
                  ttfb: { displayValue: 'N/A', score: null, numericValue: null },
                },
              });
            } else if (event.type === 'delta' && event.content) {
              setLoadingStage('streaming');
              setReport((prev) => prev + event.content);
            } else if (event.type === 'done') {
              setLoadingStage('idle');
            } else if (event.type === 'error') {
              throw new Error(event.message ?? 'Unknown error from server.');
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
      setLoadingStage('idle');
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      toast.error(message);
      setLoadingStage('idle');
    }
  }

  async function handleCopy() {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Analyser"
        description="Enter a URL to get a full AI-powered SEO audit — Core Web Vitals, on-page signals, and a prioritised action plan."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SearchCheck className="h-4 w-4 text-primary" />
            Analyse a Page
          </CardTitle>
          <CardDescription>Enter any public URL. Analysis takes 20-40 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyse} className="flex gap-3">
            <Input
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isLoading || !url.trim()} className="gap-2">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
              {isLoading ? 'Analysing...' : 'Analyse'}
            </Button>
          </form>

          {isLoading && (
            <div className="mt-4 flex items-center gap-6">
              {(['fetching', 'analysing', 'streaming'] as const).map((stage, i) => {
                const stages: LoadingStage[] = ['fetching', 'analysing', 'streaming'];
                const currentIdx = stages.indexOf(loadingStage);
                const isActive = loadingStage === stage;
                const isDone = currentIdx > i;
                return (
                  <div key={stage} className="flex items-center gap-2 text-sm">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-semibold ${
                      isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isDone ? '\u2713' : i + 1}
                    </span>
                    <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>{stageLabel(stage)}</span>
                    {isActive && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {scores && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">PageSpeed Scores (Mobile)</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Performance', score: scores.performanceScore },
              { label: 'SEO', score: scores.seoScore },
              { label: 'Accessibility', score: scores.accessibilityScore },
            ].map(({ label, score }) => (
              <div key={label} className="flex justify-center">
                <ScoreDial label={label} score={score} />
              </div>
            ))}
          </div>

          <h2 className="text-base font-semibold pt-2">Core Web Vitals</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <CWVCard label="Largest Contentful Paint" abbr="LCP" metric={scores.cwv.lcp} target="< 2.5s" />
            <CWVCard label="Interaction to Next Paint" abbr="INP" metric={scores.cwv.inp} target="< 200ms" />
            <CWVCard label="Cumulative Layout Shift" abbr="CLS" metric={scores.cwv.cls} target="< 0.1" />
            <CWVCard label="First Contentful Paint" abbr="FCP" metric={scores.cwv.fcp} target="< 1.8s" />
            <CWVCard label="Time to First Byte" abbr="TTFB" metric={scores.cwv.ttfb} target="< 800ms" />
          </div>
        </div>
      )}

      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-primary" />
              SEO Report
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy Report'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {report}
                {loadingStage === 'streaming' && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-text-bottom" />
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
