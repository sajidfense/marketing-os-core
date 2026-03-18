import { useState } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Copy, Download, Sparkles, Clock, Hash } from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface CaptionOutput {
  captions: {
    text: string;
    style: string;
    estimatedEngagement: string;
  }[];
  hashtags: string[];
  bestTimeToPost: string;
  tips: string;
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: CaptionOutput;
  tokensUsed: number;
  costEstimate: number;
}

export default function SocialCaptions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionOutput | null>(null);

  const [platform, setPlatform] = useState('Instagram');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('');
  const [brandVoice, setBrandVoice] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post<ApiResponse<SkillResult>>('/skills/social-caption', {
        platform,
        topic,
        style: style || undefined,
        brandVoice: brandVoice || undefined,
      });
      if (res.data?.output) {
        setResult(res.data.output);
        toast.success('Captions generated');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Generation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function handleExport() {
    if (!result) return;
    exportToCSV(
      result.captions.map((c) => ({ ...c, hashtags: result.hashtags.join(', ') })),
      'social-captions',
      [
        { key: 'text', label: 'Caption' },
        { key: 'style', label: 'Style' },
        { key: 'estimatedEngagement', label: 'Est. Engagement' },
        { key: 'hashtags', label: 'Hashtags' },
      ],
    );
    toast.success('Exported');
  }

  const engagementColor: Record<string, string> = {
    low: 'secondary',
    medium: 'warning',
    high: 'success',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Social Caption Generator"
        description="Craft engaging captions that drive engagement"
        actions={
          result ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3 w-3" />
              Export
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Caption Settings</CardTitle>
            <CardDescription>Configure your social captions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter/X">Twitter/X</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Product launch announcement" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Style (optional)</label>
                <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="e.g. storytelling, educational, promotional" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brand Voice (optional)</label>
                <Input value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g. modern and confident" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading || !topic.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? 'Generating...' : 'Generate Captions'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Captions */}
              {result.captions.map((caption, i) => (
                <Card key={i} className="hover:border-primary/20 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{caption.style}</Badge>
                        <Badge variant={(engagementColor[caption.estimatedEngagement] ?? 'secondary') as 'success' | 'warning' | 'secondary'} className="text-[10px]">
                          {caption.estimatedEngagement} engagement
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(caption.text)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{caption.text}</p>
                  </CardContent>
                </Card>
              ))}

              {/* Hashtags + Tips */}
              <div className="grid gap-4 sm:grid-cols-2">
                {result.hashtags?.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => copyToClipboard(`#${tag}`)}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Best Time to Post</p>
                    </div>
                    <p className="text-sm">{result.bestTimeToPost}</p>
                    {result.tips && (
                      <p className="text-xs text-muted-foreground mt-2">{result.tips}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">No captions generated yet</p>
                <p className="text-xs text-muted-foreground mt-1">Configure your settings and hit Generate</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
