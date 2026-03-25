import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  Download,
  Calendar,
  Clock,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface Report {
  id: string;
  title: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  period_start: string;
  period_end: string;
  created_at: string;
  download_url?: string;
}

const statusBadge: Record<Report['status'], 'secondary' | 'default' | 'outline' | 'destructive' | 'warning' | 'success'> = {
  pending: 'outline',
  generating: 'warning',
  completed: 'success',
  failed: 'destructive',
};

// ── Mini bar chart (SVG) ─────────────────────────────────────────────
export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const fetchReports = async () => {
    try {
      const result = await api.get<ApiResponse<Report[]>>('/reports');
      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load reports';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(periodStart) >= new Date(periodEnd)) {
      toast.error('Start date must be before end date');
      return;
    }
    setGenerating(true);
    try {
      await api.post<ApiResponse<Report>>('/reports', {
        period_start: periodStart,
        period_end: periodEnd,
      });
      toast.success('Report generation started');
      setPeriodStart('');
      setPeriodEnd('');
      await fetchReports();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to generate report';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    exportToCSV(reports, 'reports', [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'period_start', label: 'Period Start' },
      { key: 'period_end', label: 'Period End' },
      { key: 'created_at', label: 'Created' },
    ]);
    toast.success('Reports exported');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-3 w-12" /></Card>
          ))}
        </div>
        <Card className="p-5"><Skeleton className="h-[200px] w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and view board reports"
        actions={
          reports.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          ) : undefined
        }
      />

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Board Report</CardTitle>
          <CardDescription>Select a date range to generate a comprehensive board report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="periodStart" className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Input id="periodStart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="periodEnd" className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report List */}
      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first board report by selecting a date range above."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Period</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{report.title}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[report.status]}>
                        {report.status === 'generating' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(report.period_start)} — {formatDate(report.period_end)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(report.created_at)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {report.status === 'completed' && report.download_url && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(report.download_url, '_blank')}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
