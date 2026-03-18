import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Workflow as WorkflowIcon,
  Plus,
  Loader2,
  Trash2,
  X,
  Download,
  Search,
  GitBranch,
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
import type { Workflow, ApiResponse } from '@/types';

const statusBadge: Record<Workflow['status'], 'default' | 'success' | 'warning' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [campaignId, setCampaignId] = useState('');

  const fetchWorkflows = async () => {
    try {
      const result = await api.get<ApiResponse<Workflow[]>>('/workflows');
      if (result.success && result.data) {
        setWorkflows(result.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load workflows';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<ApiResponse<Workflow>>('/workflows', {
        name,
        campaign_id: campaignId || null,
      });
      toast.success('Workflow created');
      setName('');
      setCampaignId('');
      setShowForm(false);
      await fetchWorkflows();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create workflow';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/workflows/${id}`);
      toast.success('Workflow deleted');
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete workflow';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportToCSV(
      workflows.map((w) => ({ ...w, step_count: w.steps.length })),
      'workflows',
      [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'step_count', label: 'Steps' },
        { key: 'created_at', label: 'Created' },
      ]
    );
    toast.success('Workflows exported');
  };

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-5 w-32 mb-3" /><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-3 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Automate your marketing processes"
        actions={
          <>
            {workflows.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? 'Cancel' : 'New Workflow'}
            </Button>
          </>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Workflow</CardTitle>
            <CardDescription>Set up a new automation workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name *</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="campaignId" className="text-sm font-medium">Campaign ID (optional)</label>
                <Input id="campaignId" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="Link to a campaign" />
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Workflow'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {workflows.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search workflows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      )}

      {workflows.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows yet"
          description="Create your first workflow to automate repetitive marketing tasks."
          actionLabel="Create Workflow"
          onAction={() => setShowForm(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No workflows match your search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workflow) => (
            <Card key={workflow.id} className="group hover:border-primary/20 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      {workflow.campaign_id && (
                        <CardDescription className="text-xs mt-0.5">Linked to campaign</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusBadge[workflow.status]}>{workflow.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''} configured
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(workflow.id)} disabled={deletingId === workflow.id} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    {deletingId === workflow.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
