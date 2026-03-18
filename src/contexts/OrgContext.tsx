import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api, ApiError } from '@/services/api';
import type { Organization, BrandingSettings, ApiResponse } from '@/types';

interface OrgContextValue {
  currentOrg: Organization | null;
  branding: BrandingSettings | null;
  loading: boolean;
  needsOnboarding: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchOrgSettings = useCallback(async () => {
    if (!user) {
      setCurrentOrg(null);
      setBranding(null);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    try {
      // The server resolves the org from the authenticated user — no header needed
      const result = await api.get<ApiResponse<{ organization: Organization; branding: BrandingSettings | null }>>('/organizations/settings');
      if (result.success && result.data) {
        setCurrentOrg(result.data.organization);
        setBranding(result.data.branding);
        setNeedsOnboarding(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // User not assigned to any org — needs onboarding
        setCurrentOrg(null);
        setNeedsOnboarding(true);
      } else if (err instanceof ApiError && err.status === 401) {
        // Auth failure — don't set onboarding, let auth context handle it
        setCurrentOrg(null);
      } else {
        console.error('Failed to fetch organization settings:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrgSettings();
  }, [fetchOrgSettings]);

  return (
    <OrgContext.Provider value={{ currentOrg, branding, loading, needsOnboarding, refresh: fetchOrgSettings }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
