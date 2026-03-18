import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Globe,
  TrendingUp,
  Download,
  Loader2,
  BarChart3,
  Link2,
  Zap,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  trend: number[];
  results: number;
}

interface DomainOverview {
  domain: string;
  organicTraffic: number;
  organicKeywords: number;
  domainAuthority: number;
  backlinks: number;
  paidTraffic: number;
  paidKeywords: number;
  topKeywords: KeywordResult[];
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 70 ? '#EF4444' : pct > 40 ? '#F59E0B' : '#22C55E';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ── Mini sparkline for trends ────────────────────────────────────
function TrendLine({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const trending = data[data.length - 1] >= data[0];
  const color = trending ? '#22C55E' : '#EF4444';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Semrush() {
  const [tab, setTab] = useState<'keywords' | 'domain'>('keywords');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [domain, setDomain] = useState<DomainOverview | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      if (tab === 'keywords') {
        const res = await api.get<ApiResponse<KeywordResult[]>>(`/integrations/semrush/keywords?keyword=${encodeURIComponent(query)}`);
        if (res.data) setKeywords(res.data);
      } else {
        const res = await api.get<ApiResponse<DomainOverview>>(`/integrations/semrush/domain-overview?domain=${encodeURIComponent(query)}`);
        if (res.data) setDomain(res.data);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (tab === 'keywords' && keywords.length) {
      exportToCSV(keywords, 'semrush-keywords', [
        { key: 'keyword', label: 'Keyword' },
        { key: 'volume', label: 'Volume' },
        { key: 'cpc', label: 'CPC' },
        { key: 'competition', label: 'Competition' },
        { key: 'results', label: 'Results' },
      ]);
      toast.success('Keywords exported');
    } else if (tab === 'domain' && domain) {
      exportToCSV(domain.topKeywords, 'semrush-domain-keywords', [
        { key: 'keyword', label: 'Keyword' },
        { key: 'volume', label: 'Volume' },
        { key: 'cpc', label: 'CPC' },
        { key: 'competition', label: 'Competition' },
      ]);
      toast.success('Domain data exported');
    }
  }

  const hasResults = tab === 'keywords' ? keywords.length > 0 : !!domain;

  return (
    <div className="space-y-8">
      <PageHeader
        title="SEMrush"
        description="Keyword research and competitive intelligence"
        actions={
          hasResults ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          {/* Tab switch */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 w-fit mb-4">
            {(['keywords', 'domain'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setKeywords([]); setDomain(null); }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'keywords' ? <Search className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {t === 'keywords' ? 'Keyword Research' : 'Domain Overview'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'keywords' ? 'Enter a keyword...' : 'Enter a domain (e.g. example.com)'}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()} className="gap-2">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Domain Overview Results */}
      {tab === 'domain' && domain && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Domain Authority', value: domain.domainAuthority.toString(), icon: Zap, color: '#6366F1' },
              { label: 'Organic Traffic', value: formatNumber(domain.organicTraffic), icon: TrendingUp, color: '#22C55E' },
              { label: 'Organic Keywords', value: formatNumber(domain.organicKeywords), icon: Search, color: '#3B82F6' },
              { label: 'Backlinks', value: formatNumber(domain.backlinks), icon: Link2, color: '#F59E0B' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                </Card>
              );
            })}
          </div>

          {domain.topKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <KeywordTable keywords={domain.topKeywords} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Keyword Research Results */}
      {tab === 'keywords' && keywords.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Keyword Results</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{keywords.length} results</Badge>
          </CardHeader>
          <CardContent>
            <KeywordTable keywords={keywords} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KeywordTable({ keywords }: { keywords: KeywordResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword</th>
            <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
            <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CPC</th>
            <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Competition</th>
            <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trend</th>
            <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Results</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((kw, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-3 font-medium">{kw.keyword}</td>
              <td className="py-3 text-right tabular-nums">{formatNumber(kw.volume)}</td>
              <td className="py-3 text-right tabular-nums">${kw.cpc.toFixed(2)}</td>
              <td className="py-3"><CompetitionBar value={kw.competition} /></td>
              <td className="py-3 flex justify-center"><TrendLine data={kw.trend} /></td>
              <td className="py-3 text-right tabular-nums text-muted-foreground">{formatNumber(kw.results)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
