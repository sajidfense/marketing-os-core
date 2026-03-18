import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

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

const typeConfig: Record<AssetType, { icon: typeof Image; label: string }> = {
  image: { icon: Image, label: 'Image' },
  video: { icon: Video, label: 'Video' },
  document: { icon: FileText, label: 'Document' },
  audio: { icon: Music, label: 'Audio' },
};

const mockAssets: Asset[] = [
  { id: '1', name: 'Hero Banner - Spring Campaign', type: 'image', tags: ['banner', 'spring'], size: '2.4 MB', campaign: 'Spring Launch', uploadedAt: '2 days ago', color: '#6366F1' },
  { id: '2', name: 'Product Demo Video', type: 'video', tags: ['demo', 'product'], size: '48 MB', campaign: 'Q1 Growth', uploadedAt: '3 days ago', color: '#22C55E' },
  { id: '3', name: 'Brand Guidelines v3', type: 'document', tags: ['brand', 'guidelines'], size: '1.2 MB', campaign: null, uploadedAt: '1 week ago', color: '#F59E0B' },
  { id: '4', name: 'Instagram Stories Pack', type: 'image', tags: ['social', 'stories'], size: '8.6 MB', campaign: 'Brand Awareness', uploadedAt: '4 days ago', color: '#EC4899' },
  { id: '5', name: 'Podcast Intro Jingle', type: 'audio', tags: ['audio', 'podcast'], size: '3.1 MB', campaign: null, uploadedAt: '2 weeks ago', color: '#8B5CF6' },
  { id: '6', name: 'Facebook Ad Creatives', type: 'image', tags: ['ads', 'facebook'], size: '5.2 MB', campaign: 'Lead Gen', uploadedAt: '1 day ago', color: '#3B82F6' },
  { id: '7', name: 'Whitepaper - Marketing Trends 2026', type: 'document', tags: ['whitepaper', 'research'], size: '4.8 MB', campaign: null, uploadedAt: '5 days ago', color: '#14B8A6' },
  { id: '8', name: 'Testimonial Reel', type: 'video', tags: ['testimonial', 'social'], size: '22 MB', campaign: 'Brand Awareness', uploadedAt: '6 days ago', color: '#F97316' },
];

export default function CreativeLibrary() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = mockAssets
    .filter((a) => typeFilter === 'all' || a.type === typeFilter)
    .filter((a) =>
      search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.includes(search.toLowerCase()))
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Creative Library"
        description="Manage and organize your marketing assets"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Upload Asset
          </Button>
        }
      />

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
          onAction={() => {}}
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
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors">
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
