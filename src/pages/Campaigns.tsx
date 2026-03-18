import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Megaphone,
  Plus,
  Loader2,
  Trash2,
  X,
  Download,
  Search,
  MoreHorizontal,
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
import type { Campaign, ApiResponse } from '@/types';

const statusBadge: Record<Campaign['status'], 'default' | 'success' | 'warning' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  active: 'success',
  paused: 'warning',
  completed: 'default',
  archived: 'outline',
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [goal, setGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const fetchCampaigns = async () => {
    try {
      const result = await api.get<ApiResponse<Campaign[]>>('/campaigns');
      if (result.success && result.data) {
        setCampaigns(result.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load campaigns';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<ApiResponse<Campaign>>('/campaigns', {
        name,
        type,
        goal: goal || null,
        target_audience: targetAudience || null,
      });
      toast.success('Campaign created');
      setName('');
      setType('');
      setGoal('');
      setTargetAudience('');
      setShowForm(false);
      await fetchCampaigns();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create campaign';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete campaign';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportToCSV(campaigns, 'campaigns', [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'goal', label: 'Goal' },
      { key: 'target_audience', label: 'Target Audience' },
      { key: 'created_at', label: 'Created' },
    ]);
    toast.success('Campaigns exported');
  };

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Manage your marketing campaigns"
        actions={
          <>
            {campaigns.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? 'Cancel' : 'New Campaign'}
            </Button>
          </>
        }
      />

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
            <CardDescription>Fill in the details for your new campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name *</label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">Type *</label>
                  <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Social, Email, PPC" required />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="goal" className="text-sm font-medium">Goal</label>
                <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What is the campaign goal?" />
              </div>
              <div className="space-y-2">
                <label htmlFor="audience" className="text-sm font-medium">Target Audience</label>
                <Input id="audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Describe your target audience" />
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {campaigns.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Campaign Table */}
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first campaign to start organizing your marketing efforts."
          actionLabel="Create Campaign"
          onAction={() => setShowForm(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No campaigns match your search.
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Goal</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{campaign.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{campaign.type}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[campaign.status]}>{campaign.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">
                      {campaign.goal || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deletingId === campaign.id}
                        className="h-7 w-7"
                      >
                        {deletingId === campaign.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
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
