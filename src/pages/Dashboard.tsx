import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Megaphone,
  CalendarCheck,
  Workflow,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  BarChart3,
  FileText,
  Download,
  Plug,
  Video,
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  CalendarRange,
  Users,
  Target,
  Image,
  Map,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ApiResponse } from '@/types';

interface DashboardStats {
  campaigns: number;
  bookings: number;
  workflows: number;
  aiGenerations: number;
}

// ── Mini sparkline SVG (pure) ────────────────────────────────────────
function Sparkline({ data, color, className }: { data: number[]; color: string; className?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} style={{ width: w, height: h }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#grad-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Area chart component ─────────────────────────────────────────────
function AreaChart({
  data,
  labels,
  color,
  height = 200,
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const w = 600;
  const h = height;
  const padding = { top: 10, right: 10, bottom: 30, left: 45 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const points = data
    .map((v, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - (v / max) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = padding.top + chartH - pct * chartH;
    const val = Math.round(pct * max);
    return { y, val };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridLines.map(({ y, val }) => (
        <g key={val}>
          <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="hsl(240 4% 14%)" strokeWidth="1" />
          <text x={padding.left - 6} y={y + 4} textAnchor="end" fill="hsl(215 15% 40%)" fontSize="10">
            {val}
          </text>
        </g>
      ))}

      {/* Area */}
      <polygon
        points={`${padding.left},${padding.top + chartH} ${points} ${w - padding.right},${padding.top + chartH}`}
        fill="url(#area-fill)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {data.map((v, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - (v / max) * chartH;
        return <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="hsl(240 10% 4%)" strokeWidth="2" />;
      })}

      {/* X Labels */}
      {labels.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={h - 6} textAnchor="middle" fill="hsl(215 15% 40%)" fontSize="10">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Activity timeline item ───────────────────────────────────────────
function ActivityItem({
  icon: Icon,
  title,
  time,
  variant = 'default',
}: {
  icon: typeof Activity;
  title: string;
  time: string;
  variant?: 'default' | 'success' | 'warning';
}) {
  const colors = {
    default: 'bg-primary/15 text-primary',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="flex items-start gap-3 group">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors[variant]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/90 leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ── Stat card skeleton ───────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </Card>
  );
}

// ── Mock data ────────────────────────────────────────────────────────
const mockSparklines: Record<string, number[]> = {
  campaigns: [3, 5, 4, 7, 6, 8, 12],
  bookings: [2, 3, 5, 4, 6, 5, 8],
  workflows: [1, 2, 2, 3, 4, 3, 5],
  aiGenerations: [10, 15, 12, 20, 18, 25, 32],
};

const mockAreaData = [12, 18, 15, 22, 28, 24, 32, 30, 38, 42, 35, 48];
const mockAreaLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const mockActivity = [
  { icon: FileText, title: 'Board report generated for Q1', time: '2 hours ago', variant: 'success' as const },
  { icon: Megaphone, title: 'Campaign "Spring Launch" activated', time: '4 hours ago', variant: 'default' as const },
  { icon: Sparkles, title: 'AI generated ad copy for Facebook', time: '6 hours ago', variant: 'default' as const },
  { icon: BarChart3, title: 'SEO analysis completed for homepage', time: '1 day ago', variant: 'warning' as const },
  { icon: CalendarCheck, title: 'Client meeting booked for Friday', time: '1 day ago', variant: 'default' as const },
  { icon: Download, title: 'Report exported as CSV', time: '2 days ago', variant: 'success' as const },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    campaigns: 0,
    bookings: 0,
    workflows: 0,
    aiGenerations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load dashboard';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: 'Campaigns',
        value: stats.campaigns,
        trend: '+12%',
        up: true,
        icon: Megaphone,
        href: '/campaigns',
        color: '#6366F1',
        sparkline: mockSparklines.campaigns,
      },
      {
        label: 'Bookings',
        value: stats.bookings,
        trend: '+8%',
        up: true,
        icon: CalendarCheck,
        href: '/bookings',
        color: '#22C55E',
        sparkline: mockSparklines.bookings,
      },
      {
        label: 'Workflows',
        value: stats.workflows,
        trend: '+3%',
        up: true,
        icon: Workflow,
        href: '/workflows',
        color: '#A855F7',
        sparkline: mockSparklines.workflows,
      },
      {
        label: 'AI Generations',
        value: stats.aiGenerations,
        trend: '+24%',
        up: true,
        icon: Sparkles,
        href: '/skills',
        color: '#F59E0B',
        sparkline: mockSparklines.aiGenerations,
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your marketing operations"
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="group cursor-pointer p-5 hover:border-primary/20 transition-all duration-200"
                  onClick={() => navigate(stat.href)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {stat.up ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span
                          className={`text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {stat.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last period</span>
                      </div>
                    </div>
                    <Sparkline data={stat.sparkline} color={stat.color} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Charts + Activity row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Performance Overview</CardTitle>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    timePeriod === period
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <AreaChart
                data={mockAreaData}
                labels={mockAreaLabels}
                color="#6366F1"
              />
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Badge variant="secondary" className="text-[10px]">Live</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockActivity.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="h-4 w-4 text-muted-foreground" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Google Ads', href: '/google-ads', connected: false },
                { name: 'SEMrush', href: '/semrush', connected: true },
              ].map((acct) => (
                <div
                  key={acct.name}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(acct.connected ? acct.href : '/integrations')}
                >
                  <span className="text-sm font-medium">{acct.name}</span>
                  {acct.connected ? (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <XCircle className="h-2.5 w-2.5" />
                      Not connected
                    </Badge>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full gap-2 mt-1" onClick={() => navigate('/integrations')}>
                Manage Integrations
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Generate Ad Copy', href: '/ai/ad-copy', icon: Sparkles },
                { label: 'Content Calendar', href: '/content-calendar', icon: CalendarRange },
                { label: 'Campaign Planner', href: '/campaigns', icon: Megaphone },
                { label: 'Leads', href: '/leads', icon: Users },
                { label: 'SEO Analyzer', href: '/seo/analyzer', icon: Search },
                { label: 'SEO Report', href: '/seo/report', icon: FileText },
                { label: 'SEO Plan', href: '/seo-plan', icon: Target },
                { label: 'Campaign Strategy', href: '/campaign-strategy', icon: Target },
                { label: 'Video Script', href: '/ai/video-scripts', icon: Video },
                { label: 'Social Captions', href: '/ai/social-captions', icon: MessageSquare },
                { label: 'Blog Planner', href: '/ai/blog-planner', icon: FileText },
                { label: 'Creative Library', href: '/creative-library', icon: Image },
                { label: 'Roadmap', href: '/roadmap', icon: Map },
                { label: 'View Reports', href: '/reports', icon: BarChart3 },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(action.href)}
                  className="gap-2"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
