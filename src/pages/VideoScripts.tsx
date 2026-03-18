import { useState } from 'react';
import { toast } from 'sonner';
import { Video, Loader2, Copy, Download, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { useCredits } from '@/contexts/CreditsContext';
import { CreditCostBadge } from '@/components/shared/CreditCostBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { ApiResponse } from '@/types';

interface VideoScriptOutput {
  hook: string;
  script: string;
  cta: string;
  visualNotes: string[];
  hashtags: string[];
  estimatedDuration: string;
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: VideoScriptOutput;
  tokensUsed: number;
  costEstimate: number;
}

export default function VideoScripts() {
  const { isExhausted, refresh: refreshCredits } = useCredits();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoScriptOutput | null>(null);

  const [platform, setPlatform] = useState('TikTok');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [duration, setDuration] = useState('30-60 seconds');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post<ApiResponse<SkillResult>>('/skills/video-script', {
        platform,
        topic,
        tone: tone || undefined,
        duration,
      });
      if (res.data?.output) {
        setResult(res.data.output);
        toast.success('Script generated');
      }
      refreshCredits();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Generation failed';
      toast.error(msg);
      refreshCredits();
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
      [{ hook: result.hook, script: result.script, cta: result.cta, hashtags: result.hashtags.join(', ') }],
      'video-script',
      [
        { key: 'hook', label: 'Hook' },
        { key: 'script', label: 'Script' },
        { key: 'cta', label: 'CTA' },
        { key: 'hashtags', label: 'Hashtags' },
      ],
    );
    toast.success('Exported');
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Video Script Generator"
        description="Create viral hooks and scripts for short-form video"
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
            <CardTitle className="text-base">Script Settings</CardTitle>
            <CardDescription>Configure your video script</CardDescription>
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
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How to grow your business" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tone (optional)</label>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. energetic, professional, humorous" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="15-30 seconds">15-30 seconds</option>
                  <option value="30-60 seconds">30-60 seconds</option>
                  <option value="60-90 seconds">60-90 seconds</option>
                </select>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading || !topic.trim() || isExhausted}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? 'Generating...' : 'Generate Script'}
                <CreditCostBadge skillType="video-script" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Hook */}
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="text-[10px]">Hook</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.hook)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{result.hook}</p>
                </CardContent>
              </Card>

              {/* Script */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px]">Full Script</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.script)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{result.script}</p>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-emerald-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="success" className="text-[10px]">Call to Action</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.cta)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium">{result.cta}</p>
                </CardContent>
              </Card>

              {/* Visual Notes + Hashtags */}
              <div className="grid gap-4 sm:grid-cols-2">
                {result.visualNotes?.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Visual Notes</p>
                      <ul className="space-y-1.5">
                        {result.visualNotes.map((note, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                            <Video className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {result.hashtags?.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">#{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">No script generated yet</p>
                <p className="text-xs text-muted-foreground mt-1">Configure your settings and hit Generate</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
