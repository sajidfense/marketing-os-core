import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Megaphone,
  CalendarCheck,
  Workflow,
  Sparkles,
  ArrowRight,
  BarChart3,
  FileText,
  Plug,
  Video,
  MessageSquare,
  Search,
  CalendarRange,
  Users,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ApiResponse } from '@/types';

interface DashboardStats {
  campaigns: number;
  bookings: number;
  workflows: number;
  aiGenerations: number;
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


export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    campaigns: 0,
    bookings: 0,
    workflows: 0,
    aiGenerations: 0,
  });
  const [loading, setLoading] = useState(true);

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
        icon: Megaphone,
        href: '/campaigns',
        color: '#6366F1',
      },
      {
        label: 'Bookings',
        value: stats.bookings,
        icon: CalendarCheck,
        href: '/bookings',
        color: '#22C55E',
      },
      {
        label: 'Workflows',
        value: stats.workflows,
        icon: Workflow,
        href: '/workflows',
        color: '#A855F7',
      },
      {
        label: 'AI Generations',
        value: stats.aiGenerations,
        icon: Sparkles,
        href: '/skills',
        color: '#F59E0B',
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
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                </Card>
              );
            })}
      </div>

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
              { label: 'Integrations', href: '/integrations', icon: Plug },
              { label: 'Video Script', href: '/ai/video-scripts', icon: Video },
              { label: 'Social Captions', href: '/ai/social-captions', icon: MessageSquare },
              { label: 'Blog Planner', href: '/ai/blog-planner', icon: FileText },
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
  );
}
