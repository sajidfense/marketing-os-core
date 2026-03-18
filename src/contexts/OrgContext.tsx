import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';
import type { Organization, BrandingSettings, ApiResponse } from '@/types';

interface OnboardingStatus {
  hasOrganizations: boolean;
  organizations: Array<{ id: string; name: string; role: string }>;
}

interface OrgContextValue {
  currentOrg: Organization | null;
  branding: BrandingSettings | null;
  loading: boolean;
  needsOnboarding: boolean;
  switchOrg: (orgId: string) => void;
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
      let orgId = localStorage.getItem('currentOrganizationId');

      // No org in localStorage — check if user has any orgs
      if (!orgId) {
        const status = await api.get<ApiResponse<OnboardingStatus>>('/onboarding/status');
        if (status.success && status.data) {
          if (status.data.hasOrganizations && status.data.organizations.length > 0) {
            // Auto-select first org
            orgId = status.data.organizations[0].id;
            localStorage.setItem('currentOrganizationId', orgId);
          } else {
            // No orgs — needs onboarding
            setNeedsOnboarding(true);
            setLoading(false);
            return;
          }
        } else {
          setNeedsOnboarding(true);
          setLoading(false);
          return;
        }
      }

      // Fetch org settings
      const result = await api.get<ApiResponse<{ organization: Organization; branding: BrandingSettings | null }>>('/organizations/settings');
      if (result.success && result.data) {
        setCurrentOrg(result.data.organization);
        setBranding(result.data.branding);
        setNeedsOnboarding(false);
      }
    } catch (err) {
      // If 403, user was removed from org — clear and check status
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 403) {
        localStorage.removeItem('currentOrganizationId');
        setCurrentOrg(null);
        try {
          const status = await api.get<ApiResponse<OnboardingStatus>>('/onboarding/status');
          if (status.data?.hasOrganizations && status.data.organizations.length > 0) {
            localStorage.setItem('currentOrganizationId', status.data.organizations[0].id);
            setLoading(true);
            fetchOrgSettings();
            return;
          }
        } catch {
          // fallthrough
        }
        setNeedsOnboarding(true);
      } else {
        console.error('Failed to fetch organization settings');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrgSettings();
  }, [fetchOrgSettings]);

  const switchOrg = useCallback((orgId: string) => {
    localStorage.setItem('currentOrganizationId', orgId);
    setLoading(true);
    fetchOrgSettings();
  }, [fetchOrgSettings]);

  return (
    <OrgContext.Provider value={{ currentOrg, branding, loading, needsOnboarding, switchOrg, refresh: fetchOrgSettings }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
