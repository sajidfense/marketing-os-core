import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';
import { api } from '@/services/api';
import type { ApiResponse, CreditsData, CreditPack } from '@/types';

interface CreditsContextValue {
  credits: CreditsData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** True when usage >= 80% */
  isWarning: boolean;
  /** True when usage >= 100% */
  isExhausted: boolean;
  /** Get credit cost for a specific skill */
  getCost: (skillType: string) => number;
  /** Buy a credit pack — returns Stripe checkout URL */
  buyCredits: (pack: CreditPack) => Promise<string>;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user || !currentOrg) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const result = await api.get<ApiResponse<CreditsData>>('/billing/credits');
      if (result.success && result.data) {
        setCredits(result.data);
      }
    } catch {
      // Silently fail — credits display is non-critical
      console.error('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  }, [user, currentOrg]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const isWarning = credits ? credits.percent >= 80 : false;
  const isExhausted = credits ? credits.percent >= 100 : false;

  const getCost = useCallback(
    (skillType: string): number => {
      if (!credits) return 0;
      return credits.costs[skillType] ?? 2;
    },
    [credits],
  );

  const buyCredits = useCallback(
    async (pack: CreditPack): Promise<string> => {
      const origin = window.location.origin;
      const result = await api.post<ApiResponse<{ url: string }>>('/billing/buy-credits', {
        packId: pack.id,
        successUrl: `${origin}/settings?credits=success`,
        cancelUrl: `${origin}/settings?credits=cancelled`,
      });
      if (!result.success || !result.data?.url) {
        throw new Error('Failed to create checkout session');
      }
      return result.data.url;
    },
    [],
  );

  return (
    <CreditsContext.Provider
      value={{ credits, loading, refresh: fetchCredits, isWarning, isExhausted, getCost, buyCredits }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider');
  return ctx;
}
