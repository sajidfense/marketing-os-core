import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Plug,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ApiResponse } from '@/types';

// ── Types ────────────────────────────────────────────────────────

type Provider = 'semrush' | 'google_ads' | 'openai';

interface VaultStatusItem {
  provider: Provider;
  connected: boolean;
  connectedAt: string | null;
  updatedAt: string | null;
}

// ── Provider configs ─────────────────────────────────────────────

interface ProviderConfig {
  provider: Provider;
  name: string;
  description: string;
  icon: () => JSX.Element;
  color: string;
  placeholder: string;
}

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const SemrushIcon = () => (
  <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-white text-[10px] font-bold">
    SE
  </div>
);

const OpenAIIcon = () => (
  <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-800 text-white text-[10px] font-bold">
    AI
  </div>
);

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'google_ads',
    name: 'Google Ads',
    description: 'Connect your Google Ads API key to track spend, campaigns, and conversions.',
    icon: GoogleAdsIcon,
    color: '#4285F4',
    placeholder: 'AIza...',
  },
  {
    provider: 'semrush',
    name: 'SEMrush',
    description: 'Keyword research, domain analysis, and competitive intelligence.',
    icon: SemrushIcon,
    color: '#FF622D',
    placeholder: 'Enter your SEMrush API key',
  },
  {
    provider: 'openai',
    name: 'OpenAI',
    description: 'Use your own OpenAI key for advanced AI features and higher limits.',
    icon: OpenAIIcon,
    color: '#10A37F',
    placeholder: 'sk-...',
  },
];

// ── Integration Card ─────────────────────────────────────────────

interface IntegrationCardProps {
  config: ProviderConfig;
  connected: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}

function IntegrationCard({ config, connected, onSaved, onDeleted }: IntegrationCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = config.icon;

  async function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API key is required');
      return;
    }
    if (trimmed.length < 8) {
      setError('API key seems too short');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await api.post<ApiResponse<void>>('/integrations/vault/save', {
        provider: config.provider,
        api_key: trimmed,
      });
      toast.success(`${config.name} key saved securely`);
      setApiKey('');
      setShowKey(false);
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save API key';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete<ApiResponse<void>>(`/integrations/vault/${config.provider}`);
      toast.success(`${config.name} disconnected`);
      onDeleted();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to disconnect';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:border-primary/20">
      {/* Accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${config.color}40, transparent)` }}
      />

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{config.name}</h3>
              {connected ? (
                <Badge variant="success" className="mt-1 text-[10px]">
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  Not connected
                </Badge>
              )}
            </div>
          </div>

          {connected && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
              title="Disconnect"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {config.description}
        </p>

        {/* API Key Input */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={connected ? 'Enter new key to update' : config.placeholder}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && apiKey.trim()) handleSave();
              }}
              className={`pr-10 font-mono text-xs ${error ? 'border-destructive' : ''}`}
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}

          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <KeyRound className="h-3 w-3" />
            )}
            {connected ? 'Update Key' : 'Save Key'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const [statuses, setStatuses] = useState<VaultStatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      toast.success('Google Ads connected successfully');
    }
  }, [searchParams]);

  const loadStatuses = useCallback(async () => {
    try {
      const result = await api.get<ApiResponse<VaultStatusItem[]>>('/integrations/vault/status');
      if (result.data) setStatuses(result.data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load integrations';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  function isConnected(provider: Provider): boolean {
    return statuses.some((s) => s.provider === provider && s.connected);
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Integrations"
          description="Connect your marketing tools and data sources"
        />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect your marketing tools and data sources"
      />

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-primary">Encrypted Vault</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            API keys are encrypted with AES-256-GCM before storage. Keys are never exposed after saving and are only used server-side.
          </p>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((config) => (
          <IntegrationCard
            key={config.provider}
            config={config}
            connected={isConnected(config.provider)}
            onSaved={loadStatuses}
            onDeleted={loadStatuses}
          />
        ))}
      </div>

      {/* Upcoming integrations */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Coming Soon</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {['Meta Ads', 'LinkedIn Ads', 'HubSpot'].map((name) => (
            <Card key={name} className="p-4 opacity-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium">{name}</p>
                  <p className="text-[10px] text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
