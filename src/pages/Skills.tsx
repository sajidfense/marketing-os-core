import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  PenLine,
  Globe,
  Mail,
  GitBranch,
  Target,
  Loader2,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ApiResponse } from '@/types';

interface SkillConfig {
  key: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  endpoint: string;
  color: string;
  extraFields: { name: string; label: string; placeholder: string }[];
}

const skills: SkillConfig[] = [
  {
    key: 'ad-copy',
    label: 'Ad Copy',
    description: 'Generate compelling ad copy for any platform',
    icon: PenLine,
    endpoint: '/skills/ad-copy',
    color: '#6366F1',
    extraFields: [
      { name: 'platform', label: 'Platform', placeholder: 'e.g. Facebook, Google, LinkedIn' },
      { name: 'tone', label: 'Tone', placeholder: 'e.g. Professional, Casual, Urgent' },
    ],
  },
  {
    key: 'landing-page',
    label: 'Landing Page',
    description: 'Generate landing page copy and structure',
    icon: Globe,
    endpoint: '/skills/landing-page',
    color: '#22D3EE',
    extraFields: [
      { name: 'page_goal', label: 'Page Goal', placeholder: 'e.g. Lead capture, Product sale' },
    ],
  },
  {
    key: 'email-sequence',
    label: 'Email Sequence',
    description: 'Generate a multi-email nurture sequence',
    icon: Mail,
    endpoint: '/skills/email-sequence',
    color: '#22C55E',
    extraFields: [
      { name: 'num_emails', label: 'Number of Emails', placeholder: 'e.g. 5' },
      { name: 'sequence_goal', label: 'Sequence Goal', placeholder: 'e.g. Onboarding, Re-engagement' },
    ],
  },
  {
    key: 'funnel-strategy',
    label: 'Funnel Strategy',
    description: 'Design a complete marketing funnel',
    icon: GitBranch,
    endpoint: '/skills/funnel-strategy',
    color: '#A855F7',
    extraFields: [
      { name: 'funnel_type', label: 'Funnel Type', placeholder: 'e.g. Webinar, Free trial, Consultation' },
    ],
  },
  {
    key: 'campaign-strategy',
    label: 'Campaign Strategy',
    description: 'Generate a full campaign strategy and plan',
    icon: Target,
    endpoint: '/skills/campaign-strategy',
    color: '#F59E0B',
    extraFields: [
      { name: 'budget', label: 'Budget', placeholder: 'e.g. $5,000' },
      { name: 'duration', label: 'Duration', placeholder: 'e.g. 30 days' },
    ],
  },
];

interface SkillResult {
  content: string;
  [key: string]: unknown;
}

export default function Skills() {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, SkillResult>>({});
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (skill: SkillConfig, e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const body: Record<string, string> = { product, audience };
      skill.extraFields.forEach((field) => {
        if (extraValues[field.name]) body[field.name] = extraValues[field.name];
      });
      const result = await api.post<ApiResponse<SkillResult>>(skill.endpoint, body);
      if (result.success && result.data) {
        setResults((prev) => ({ ...prev, [skill.key]: result.data! }));
        toast.success(`${skill.label} generated successfully`);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Generation failed';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const toggleSkill = (key: string) => {
    if (activeSkill === key) {
      setActiveSkill(null);
    } else {
      setActiveSkill(key);
      setProduct('');
      setAudience('');
      setExtraValues({});
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Skills"
        description="Generate marketing content with AI-powered skills"
      />

      {/* Skill selector grid */}
      {!activeSkill && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
            const Icon = skill.icon;
            const result = results[skill.key];
            return (
              <Card
                key={skill.key}
                className="group cursor-pointer hover:border-primary/20 transition-all duration-200"
                onClick={() => toggleSkill(skill.key)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${skill.color}15`, color: skill.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {result && <Badge variant="success" className="text-[10px]">Generated</Badge>}
                  </div>
                  <h3 className="font-semibold mb-1">{skill.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    Open skill <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active skill detail */}
      {activeSkill && (() => {
        const skill = skills.find((s) => s.key === activeSkill)!;
        const Icon = skill.icon;
        const result = results[skill.key];

        return (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveSkill(null)} className="gap-1.5 text-muted-foreground mb-2">
              <ArrowRight className="h-3 w-3 rotate-180" />
              Back to skills
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${skill.color}15`, color: skill.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{skill.label}</CardTitle>
                    <CardDescription>{skill.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleGenerate(skill, e)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product / Service *</label>
                      <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Describe your product or service" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Audience *</label>
                      <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this for?" required />
                    </div>
                  </div>
                  {skill.extraFields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-medium">{field.label}</label>
                      <Input
                        value={extraValues[field.name] || ''}
                        onChange={(e) => setExtraValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <Button type="submit" disabled={generating} className="gap-2">
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Generated Output</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.content)} className="gap-1.5">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result.content}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}
    </div>
  );
}
