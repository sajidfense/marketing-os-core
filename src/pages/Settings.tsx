import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Settings2,
  Users,
  CreditCard,
  BarChart3,
  Loader2,
  Send,
  Shield,
  Clock,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import type { ApiResponse } from '@/types';

export default function Settings() {
  const { currentOrg } = useOrg();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post<ApiResponse<unknown>>('/organizations/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send invitation';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const planBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
    free: 'secondary',
    starter: 'outline',
    pro: 'default',
    enterprise: 'success',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your organization settings" />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Organization</CardTitle>
                <CardDescription>Your organization details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentOrg ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Name</p>
                    <p className="text-sm font-semibold">{currentOrg.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Slug</p>
                    <p className="font-mono text-sm text-muted-foreground">{currentOrg.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                    <Badge variant={currentOrg.is_active ? 'success' : 'secondary'}>
                      {currentOrg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Created</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(currentOrg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No organization selected</p>
            )}
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Plan</CardTitle>
                <CardDescription>Your current subscription</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentOrg ? (
              <>
                <Badge variant={planBadgeVariant[currentOrg.plan] || 'default'} className="text-sm px-3 py-1">
                  {currentOrg.plan.charAt(0).toUpperCase() + currentOrg.plan.slice(1)} Plan
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {currentOrg.plan === 'free'
                    ? 'Upgrade to unlock more features and higher limits.'
                    : 'You have access to all plan features.'}
                </p>
                {currentOrg.plan === 'free' && (
                  <Button
                    size="sm"
                    className="gap-2 mt-2"
                    onClick={() => toast.info('Upgrade plans coming soon. Contact sales for enterprise pricing.')}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Upgrade Plan
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No organization selected</p>
            )}
          </CardContent>
        </Card>

        {/* Invite Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Invite Members</CardTitle>
                <CardDescription>Add team members to your organization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="inviteEmail" className="text-sm font-medium">Email address</label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex gap-2">
                  {(['member', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                        inviteRole === role
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={inviting} size="sm" className="gap-2">
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Usage</CardTitle>
                <CardDescription>Your current usage statistics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'AI Generations', value: '12' },
                { label: 'Active Campaigns', value: '3' },
                { label: 'Team Members', value: '1' },
                { label: 'Storage Used', value: '24 MB' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Usage data refreshes periodically.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
