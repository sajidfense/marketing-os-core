import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Mail,
  Building2,
  Globe,
  Tag,
  MoreHorizontal,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { exportToCSV } from '@/lib/export';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string;
  stage: LeadStage;
  value: number;
  tags: string[];
  lastActivity: string;
}

/** Shape returned by the API for a single lead row. */
interface ApiLead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  stage: LeadStage;
  value: number;
  tags: string[] | null;
  last_activity: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const stageConfig: Record<LeadStage, { label: string; color: string; variant: 'secondary' | 'default' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  new: { label: 'New', color: '#3B82F6', variant: 'default' },
  contacted: { label: 'Contacted', color: '#8B5CF6', variant: 'default' },
  qualified: { label: 'Qualified', color: '#F59E0B', variant: 'warning' },
  proposal: { label: 'Proposal', color: '#6366F1', variant: 'default' },
  won: { label: 'Won', color: '#22C55E', variant: 'success' },
  lost: { label: 'Lost', color: '#64748B', variant: 'secondary' },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function mapApiLead(apiLead: ApiLead): Lead {
  return {
    id: apiLead.id,
    name: apiLead.name,
    email: apiLead.email,
    company: apiLead.company ?? '',
    website: apiLead.website ?? '',
    stage: apiLead.stage,
    value: apiLead.value ?? 0,
    tags: apiLead.tags ?? [],
    lastActivity: formatRelativeDate(apiLead.last_activity ?? apiLead.created_at),
  };
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [view, setView] = useState<'table' | 'pipeline'>('table');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [addValue, setAddValue] = useState('');
  const [addStage, setAddStage] = useState<LeadStage>('new');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApiLead[]>>('/leads');
      if (res.success && res.data) {
        setLeads(res.data.map(mapApiLead));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load leads';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads
    .filter((l) => stageFilter === 'all' || l.stage === stageFilter)
    .filter((l) =>
      search === '' ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
    );

  const pipelineStages: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'won'];

  function handleExport() {
    exportToCSV(
      filtered.map((l) => ({ ...l, tags: l.tags.join(', ') })),
      'leads',
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'company', label: 'Company' },
        { key: 'stage', label: 'Stage' },
        { key: 'value', label: 'Value' },
        { key: 'tags', label: 'Tags' },
      ],
    );
    toast.success('Leads exported');
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<ApiResponse<ApiLead>>('/leads', {
        name: addName,
        email: addEmail,
        company: addCompany || null,
        website: null,
        stage: addStage,
        value: parseInt(addValue, 10) || 0,
        tags: [],
      });
      setShowAdd(false);
      setAddName('');
      setAddEmail('');
      setAddCompany('');
      setAddValue('');
      setAddStage('new');
      toast.success('Lead added');
      await fetchLeads();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add lead';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalValue = filtered.reduce((s, l) => s + l.value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads"
        description={`${filtered.length} leads \u00b7 ${formatCurrency(totalValue)} pipeline value`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3 w-3" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Add Lead Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
          <DialogDescription>Add a new lead to your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Full name" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@company.com" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input value={addCompany} onChange={(e) => setAddCompany(e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal Value ($)</label>
              <Input type="number" value={addValue} onChange={(e) => setAddValue(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stage</label>
            <select
              value={addStage}
              onChange={(e) => setAddStage(e.target.value as LeadStage)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {Object.entries(stageConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addName.trim() || !addEmail.trim() || submitting}>
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {submitting ? 'Adding...' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {(['table', 'pipeline'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                  view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as LeadStage | 'all')}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Stages</option>
            {Object.entries(stageConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const cfg = stageConfig[stage];
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="min-w-[240px] flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs font-semibold">{cfg.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-3 cursor-pointer hover:border-primary/20 transition-all duration-150">
                      <p className="text-xs font-semibold truncate">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium tabular-nums" style={{ color: cfg.color }}>
                          {formatCurrency(lead.value)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{lead.lastActivity}</span>
                      </div>
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {lead.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-8">
                      <p className="text-[10px] text-muted-foreground">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="No leads found"
                  description="Add your first lead or adjust your search filters."
                  actionLabel="Add Lead"
                  onAction={() => setShowAdd(true)}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const cfg = stageConfig[lead.stage];
                      return (
                        <tr key={lead.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{lead.company}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.variant as 'default'} className="text-[10px]">{cfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(lead.value)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                  <Tag className="h-2 w-2" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">{lead.lastActivity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
