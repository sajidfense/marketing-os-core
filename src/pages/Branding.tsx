import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Palette, Loader2, Save } from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import type { BrandingSettings, ApiResponse } from '@/types';

export default function Branding() {
  const { refresh } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [appName, setAppName] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const result = await api.get<ApiResponse<BrandingSettings>>('/branding');
        if (result.success && result.data) {
          const b = result.data;
          setLogoUrl(b.logo_url || '');
          setPrimaryColor(b.primary_color || '#6366f1');
          setAccentColor(b.accent_color || '#a855f7');
          setAppName(b.app_name || '');
          setReportTitle(b.report_title || '');
          setFooterText(b.footer_text || '');
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load branding';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchBranding();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put<ApiResponse<BrandingSettings>>('/branding', {
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        app_name: appName || null,
        report_title: reportTitle || null,
        footer_text: footerText || null,
      });
      toast.success('Branding settings saved');
      await refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save branding';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6"><Skeleton className="h-[400px] w-full" /></Card>
          <Card className="p-6"><Skeleton className="h-[300px] w-full" /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Branding" description="Customize the look and feel of your workspace" />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Branding Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Brand Settings</CardTitle>
                  <CardDescription>Configure your organization branding</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="logoUrl" className="text-sm font-medium">Logo URL</label>
                  <Input id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="h-10 w-10 rounded-xl border" style={{ backgroundColor: primaryColor }} />
                      </div>
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#6366f1" className="font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="h-10 w-10 rounded-xl border" style={{ backgroundColor: accentColor }} />
                      </div>
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#a855f7" className="font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="appName" className="text-sm font-medium">App Name</label>
                  <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="MarketingOS" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="reportTitle" className="text-sm font-medium">Report Title</label>
                    <Input id="reportTitle" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Monthly Board Report" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="footerText" className="text-sm font-medium">Footer Text</label>
                    <Input id="footerText" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Powered by MarketingOS" />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>See how your branding looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {logoUrl && (
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Logo</p>
                <div className="flex items-center justify-center rounded-xl border bg-muted/30 p-4">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Colors</p>
              <div className="flex gap-3">
                {[
                  { label: 'Primary', color: primaryColor },
                  { label: 'Accent', color: accentColor },
                ].map((c) => (
                  <div key={c.label} className="text-center space-y-1">
                    <div className="h-14 w-14 rounded-xl border shadow-sm" style={{ backgroundColor: c.color }} />
                    <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Header</p>
              <div className="rounded-xl px-4 py-3 text-white" style={{ backgroundColor: primaryColor }}>
                <p className="font-semibold text-sm">{appName || 'Syntra OS'}</p>
              </div>
            </div>

            {(reportTitle || footerText) && (
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Report</p>
                <div className="rounded-xl border p-4">
                  {reportTitle && <p className="font-semibold text-sm">{reportTitle}</p>}
                  {footerText && <p className="mt-2 border-t pt-2 text-center text-[10px] text-muted-foreground">{footerText}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
