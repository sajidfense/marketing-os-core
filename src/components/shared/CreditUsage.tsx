import { useState } from 'react';
import { toast } from 'sonner';
import {
  Zap,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Loader2,
  Clock,
  Info,
} from 'lucide-react';
import { useCredits } from '@/contexts/CreditsContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CreditPack } from '@/types';

// ── Credit Usage Card ───────────────────────────────────────
export function CreditUsageCard() {
  const { credits, loading, isWarning, isExhausted } = useCredits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">AI Credits</CardTitle>
              <CardDescription>Loading usage...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!credits) return null;

  const percent = credits.percent;
  const barColor = isExhausted
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-primary';

  const statusIcon = isExhausted
    ? <XCircle className="h-4 w-4 text-red-400" />
    : isWarning
      ? <AlertTriangle className="h-4 w-4 text-amber-400" />
      : <Zap className="h-4 w-4 text-emerald-400" />;

  const statusColor = isExhausted
    ? 'bg-red-500/10 text-red-400'
    : isWarning
      ? 'bg-amber-500/10 text-amber-400'
      : 'bg-emerald-500/10 text-emerald-400';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', statusColor)}>
            {statusIcon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">AI Credits</CardTitle>
              {isExhausted && (
                <Badge variant="destructive" className="text-[10px]">Out of credits</Badge>
              )}
              {isWarning && !isExhausted && (
                <Badge variant="warning" className="text-[10px]">Running low</Badge>
              )}
            </div>
            <CardDescription>Track your AI usage and purchase more credits</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Usage bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium tabular-nums">
              {credits.credits_used.toLocaleString()} / {credits.credits_limit.toLocaleString()} credits used
            </span>
            <span className="text-muted-foreground tabular-nums">{percent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Reset date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Resets in {credits.days_until_reset} day{credits.days_until_reset !== 1 ? 's' : ''}{' '}
            ({new Date(credits.reset_date).toLocaleDateString()})
          </span>
        </div>

        {/* Credit costs tooltip */}
        <CreditCostTable costs={credits.costs} />

        {/* Buy credits */}
        <BuyCreditsSection />
      </CardContent>
    </Card>
  );
}

// ── Credit Cost Reference ───────────────────────────────────
function CreditCostTable({ costs }: { costs: Record<string, number> }) {
  const [expanded, setExpanded] = useState(false);

  const entries = Object.entries(costs).sort((a, b) => a[1] - b[1]);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3 w-3" />
        <span>{expanded ? 'Hide' : 'View'} credit costs per action</span>
      </button>
      {expanded && (
        <div className="mt-2 rounded-lg border border-border/50 p-3 space-y-1.5">
          {entries.map(([skill, cost]) => (
            <div key={skill} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground capitalize">{skill.replace(/-/g, ' ')}</span>
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {cost} credit{cost !== 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Buy Credits Section ─────────────────────────────────────
function BuyCreditsSection() {
  const { credits, buyCredits, refresh } = useCredits();
  const [buying, setBuying] = useState<string | null>(null);

  if (!credits) return null;

  const packs = credits.packs;

  const handleBuy = async (pack: CreditPack) => {
    setBuying(pack.id);
    try {
      const url = await buyCredits(pack);
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed';
      toast.error(msg);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border/50">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">Buy more credits</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {packs.map((pack) => {
          const priceDisplay = `$${(pack.priceUsd / 100).toFixed(0)}`;
          const perCredit = ((pack.priceUsd / 100) / pack.credits).toFixed(2);

          return (
            <button
              key={pack.id}
              onClick={() => handleBuy(pack)}
              disabled={buying !== null}
              className={cn(
                'group relative flex flex-col items-center gap-1 rounded-xl border border-border/50 p-3 transition-all duration-150',
                'hover:border-primary/30 hover:bg-primary/5',
                buying === pack.id && 'opacity-70',
              )}
            >
              {buying === pack.id && (
                <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-primary" />
              )}
              <span className="text-lg font-bold tabular-nums">{pack.credits.toLocaleString()}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">credits</span>
              <span className="text-sm font-semibold text-primary">{priceDisplay}</span>
              <span className="text-[10px] text-muted-foreground/60">${perCredit}/credit</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact sidebar/dashboard widget ────────────────────────
export function CreditUsageMini() {
  const { credits, loading, isWarning, isExhausted } = useCredits();

  if (loading || !credits) return null;

  const barColor = isExhausted ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary';

  return (
    <div className="px-3 py-2 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60">
        <span>Credits</span>
        <span className="tabular-nums">{credits.percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(credits.percent, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {credits.credits_used} / {credits.credits_limit}
      </p>
    </div>
  );
}
