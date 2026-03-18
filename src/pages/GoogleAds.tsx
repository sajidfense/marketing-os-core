import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

interface Overview {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  roas: number;
  spendOverTime: { date: string; spend: number }[];
  conversionsOverTime: { date: string; conversions: number }[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

// ── Mini bar chart ──────────────────────────────────────────────
function BarChart({ data, color, height = 120 }: { data: { label: string; value: number }[]; color: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(40, (600 - (data.length - 1) * 8) / data.length);

  return (
    <svg viewBox={`0 0 600 ${height + 30}`} className="w-full" style={{ maxHeight: height + 30 }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * height;
        const x = i * (barW + 8) + (600 - data.length * (barW + 8) + 8) / 2;
        const y = height - barH;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={0.8}
              className="transition-all duration-300 hover:opacity-100"
            />
            <text
              x={x + barW / 2}
              y={height + 16}
              textAnchor="middle"
              fill="hsl(215 15% 40%)"
              fontSize="10"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function GoogleAds() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [overviewRes, campaignsRes] = await Promise.all([
        api.get<ApiResponse<Overview>>('/integrations/google/overview'),
        api.get<ApiResponse<Campaign[]>>('/integrations/google/campaigns'),
      ]);
      if (overviewRes.data) setOverview(overviewRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load Google Ads data';
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  function handleExport() {
    exportToCSV(campaigns, 'google-ads-campaigns', [
      { key: 'name', label: 'Campaign' },
      { key: 'status', label: 'Status' },
      { key: 'spend', label: 'Spend' },
      { key: 'impressions', label: 'Impressions' },
      { key: 'clicks', label: 'Clicks' },
      { key: 'conversions', label: 'Conversions' },
      { key: 'ctr', label: 'CTR %' },
      { key: 'cpc', label: 'CPC' },
    ]);
    toast.success('Exported to CSV');
  }

  const statCards = overview
    ? [
        { label: 'Total Spend', value: formatCurrency(overview.totalSpend), icon: DollarSign, color: '#6366F1' },
        { label: 'Impressions', value: formatNumber(overview.totalImpressions), icon: Eye, color: '#22C55E' },
        { label: 'Clicks', value: formatNumber(overview.totalClicks), icon: MousePointerClick, color: '#3B82F6' },
        { label: 'Conversions', value: formatNumber(overview.totalConversions), icon: Target, color: '#F59E0B' },
        { label: 'Avg CTR', value: `${overview.avgCtr.toFixed(2)}%`, icon: TrendingUp, color: '#A855F7' },
        { label: 'ROAS', value: `${overview.roas.toFixed(1)}x`, icon: DollarSign, color: '#10B981' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Google Ads"
        description="Campaign performance and spend analytics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={campaigns.length === 0}>
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-20" />
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                </Card>
              );
            })}
      </div>

      {/* Charts */}
      {overview && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={overview.spendOverTime.map((d) => ({ label: d.date, value: d.spend }))}
                color="#6366F1"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={overview.conversionsOverTime.map((d) => ({ label: d.date, value: d.conversions }))}
                color="#22C55E"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
                    <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spend</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impressions</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Clicks</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conv.</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CTR</th>
                    <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{c.name}</td>
                      <td className="py-3">
                        <Badge variant={c.status === 'ENABLED' ? 'success' : 'secondary'} className="text-[10px]">
                          {c.status === 'ENABLED' ? 'Active' : 'Paused'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatCurrency(c.spend)}</td>
                      <td className="py-3 text-right tabular-nums">{formatNumber(c.impressions)}</td>
                      <td className="py-3 text-right tabular-nums">{formatNumber(c.clicks)}</td>
                      <td className="py-3 text-right tabular-nums">{c.conversions}</td>
                      <td className="py-3 text-right tabular-nums">{c.ctr.toFixed(1)}%</td>
                      <td className="py-3 text-right tabular-nums">{formatCurrency(c.cpc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
