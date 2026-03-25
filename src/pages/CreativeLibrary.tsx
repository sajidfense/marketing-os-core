import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Image,
  Plus,
  Search,
  Download,
  Grid3X3,
  List,
  Tag,
  FileText,
  Video,
  Music,
  Filter,
  MoreHorizontal,
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
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/services/api';
import type { ApiResponse } from '@/types';

type AssetType = 'image' | 'video' | 'document' | 'audio';

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  tags: string[];
  size: string;
  campaign: string | null;
  uploadedAt: string;
  color: string; // placeholder color
}

interface ApiAsset {
  id: string;
  name: string;
  asset_type: AssetType;
  tags: string[] | null;
  file_size: number | null;
  file_url: string | null;
  campaign: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const typeConfig: Record<AssetType, { icon: typeof Image; label: string }> = {
  image: { icon: Image, label: 'Image' },
  video: { icon: Video, label: 'Video' },
  document: { icon: FileText, label: 'Document' },
  audio: { icon: Music, label: 'Audio' },
};

const placeholderColors = ['#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6', '#F97316'];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return placeholderColors[Math.abs(hash) % placeholderColors.length];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function mapApiAsset(a: ApiAsset): Asset {
  return {
    id: a.id,
    name: a.name,
    type: a.asset_type,
    tags: a.tags ?? [],
    size: formatFileSize(a.file_size),
    campaign: a.campaign,
    uploadedAt: formatDate(a.created_at),
    color: hashColor(a.name),
  };
}

export default function CreativeLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<AssetType>('image');
  const [addTags, setAddTags] = useState('');
  const [addCampaign, setAddCampaign] = useState('');

  const fetchAssets = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ApiAsset[]>>('/creative-assets');
      if (res.success && res.data) {
        setAssets(res.data.map(mapApiAsset));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load assets';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filtered = assets
    .filter((a) => typeFilter === 'all' || a.type === typeFilter)
    .filter((a) =>
      search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.includes(search.toLowerCase()))
    );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post<ApiResponse<ApiAsset>>('/creative-assets', {
        name: addName,
        asset_type: addType,
        tags: addTags.split(',').map((t) => t.trim()).filter(Boolean),
        campaign: addCampaign || null,
      });
      setShowAdd(false);
      setAddName('');
      setAddTags('');
      setAddCampaign('');
      setAddType('image');
      toast.success('Asset added to library');
      await fetchAssets();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add asset';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Creative Library"
        description="Manage and organize your marketing assets"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload Asset
          </Button>
        }
      />

      {/* Upload Asset Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>Upload Asset</DialogTitle>
          <DialogDescription>Add a new asset to your creative library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Name *</label>
            <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Facebook Ad Banner - Summer" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as AssetType)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign</label>
              <Input value={addCampaign} onChange={(e) => setAddCampaign(e.target.value)} placeholder="Optional campaign" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input value={addTags} onChange={(e) => setAddTags(e.target.value)} placeholder="e.g. banner, social, campaign" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addName.trim()}>
              <Plus className="h-3.5 w-3.5" />
              Add Asset
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v === 'grid' ? <Grid3X3 className="h-3 w-3" /> : <List className="h-3 w-3" />}
              </button>
            ))}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AssetType | 'all')}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No assets found"
          description="Upload your first creative asset or adjust your search."
          actionLabel="Upload Asset"
          onAction={() => setShowAdd(true)}
        />
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => {
            const tc = typeConfig[asset.type];
            const Icon = tc.icon;
            return (
              <Card key={asset.id} className="group overflow-hidden cursor-pointer hover:border-primary/20 transition-all duration-200">
                {/* Placeholder thumbnail */}
                <div
                  className="relative h-36 flex items-center justify-center"
                  style={{ backgroundColor: `${asset.color}10` }}
                >
                  <Icon className="h-10 w-10 opacity-30" style={{ color: asset.color }} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`Downloaded ${asset.name}`);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur-sm">{tc.label}</Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate">{asset.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{asset.size}</span>
                    <span className="text-[10px] text-muted-foreground">{asset.uploadedAt}</span>
                  </div>
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {asset.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          <Tag className="h-2 w-2" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset) => {
                    const tc = typeConfig[asset.type];
                    const Icon = tc.icon;
                    return (
                      <tr key={asset.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${asset.color}15`, color: asset.color }}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium text-sm truncate max-w-[200px]">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-[10px]">{tc.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {asset.tags.map((tag) => (
                              <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{asset.campaign ?? '-'}</td>
                        <td className="px-4 py-3 text-right text-xs tabular-nums text-muted-foreground">{asset.size}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{asset.uploadedAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
