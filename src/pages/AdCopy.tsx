import { useState } from 'react';
import { toast } from 'sonner';
import { PenLine, Loader2, Copy, Download, Sparkles, Check } from 'lucide-react';
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

interface AdCopyOutput {
  headline: string;
  body: string;
  cta: string;
  variations: { headline: string; body: string }[];
}

interface SkillResult {
  generationId: string;
  skillType: string;
  output: AdCopyOutput;
  tokensUsed: number;
  costEstimate: number;
}

export default function AdCopy() {
  const { isExhausted, refresh: refreshCredits } = useCredits();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdCopyOutput | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [platform, setPlatform] = useState('Facebook');
  const [tone, setTone] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !audience.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post<ApiResponse<SkillResult>>('/skills/ad-copy', {
        product,
        audience,
        platform,
        tone: tone || undefined,
      });
      if (res.data?.output) {
        setResult(res.data.output);
        toast.success('Ad copy generated');
      } else if (res.data) {
        // Fallback for flat content response
        const data = res.data as unknown as Record<string, unknown>;
        if (typeof data.content === 'string') {
          setResult({
            headline: 'Generated Ad Copy',
            body: data.content,
            cta: '',
            variations: [],
          });
          toast.success('Ad copy generated');
        }
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

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  }

  function handleExport() {
    if (!result) return;
    exportToCSV(
      [{ headline: result.headline, body: result.body, cta: result.cta }],
      'ad-copy',
      [
        { key: 'headline', label: 'Headline' },
        { key: 'body', label: 'Body' },
        { key: 'cta', label: 'CTA' },
      ],
    );
    toast.success('Exported');
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ad Copy Generator"
        description="Generate high-converting ad copy for any platform"
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
            <CardTitle className="text-base">Ad Settings</CardTitle>
            <CardDescription>Configure your ad copy generation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product / Service *</label>
                <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Describe your product or service" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Audience *</label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this ad for?" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google Ads</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter">Twitter / X</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tone (optional)</label>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. professional, urgent, playful" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading || !product.trim() || !audience.trim() || isExhausted}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? 'Generating...' : 'Generate Ad Copy'}
                <CreditCostBadge skillType="ad-copy" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Headline */}
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="text-[10px]">Headline</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.headline, 'headline')}>
                      {copied === 'headline' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{result.headline}</p>
                </CardContent>
              </Card>

              {/* Body */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px]">Ad Body</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.body, 'body')}>
                      {copied === 'body' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{result.body}</p>
                </CardContent>
              </Card>

              {/* CTA */}
              {result.cta && (
                <Card className="border-emerald-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="success" className="text-[10px]">Call to Action</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(result.cta, 'cta')}>
                        {copied === 'cta' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{result.cta}</p>
                  </CardContent>
                </Card>
              )}

              {/* Variations */}
              {result.variations?.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Variations</p>
                    <div className="space-y-3">
                      {result.variations.map((v, i) => (
                        <div key={i} className="rounded-lg border border-border/50 p-3">
                          <p className="text-xs font-semibold mb-1">{v.headline}</p>
                          <p className="text-xs text-foreground/80">{v.body}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">No ad copy generated yet</p>
                <p className="text-xs text-muted-foreground mt-1">Configure your settings and hit Generate</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
