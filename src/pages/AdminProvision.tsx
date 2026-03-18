import { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ProvisionResult {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    comped: boolean;
    subscription_status: string;
  };
  user: {
    id: string;
    email: string;
  };
  message: string;
}

export default function AdminProvision() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [comped, setComped] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
      const res = await fetch(`${apiUrl}/admin/provision-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          organization_name: orgName,
          admin_email: adminEmail,
          password,
          plan,
          comped,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Provisioning failed');
      }

      setResult(json.data);
      toast.success('Client provisioned successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Provisioning failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setOrgName('');
    setAdminEmail('');
    setPassword('');
    setPlan('pro');
    setComped(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Provisioning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new client organization with user account.
          </p>
        </div>

        {/* Success state */}
        {result && (
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-green-400">Client provisioned successfully</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p><span className="text-foreground/70">Organization:</span> {result.organization.name}</p>
                    <p><span className="text-foreground/70">Plan:</span> {result.organization.plan}</p>
                    <p><span className="text-foreground/70">Comped:</span> {result.organization.comped ? 'Yes' : 'No'}</p>
                    <p><span className="text-foreground/70">Login email:</span> {result.user.email}</p>
                    <p><span className="text-foreground/70">Org ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.organization.id}</code></p>
                    <p><span className="text-foreground/70">User ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.user.id}</code></p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={handleReset}
              >
                Provision Another Client
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && !result && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-400">Provisioning failed</p>
                  <p className="text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Client</CardTitle>
              <CardDescription>
                This will create an organization, user account, and link them together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Admin Secret */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Admin Secret
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter admin secret"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                <hr className="border-border" />

                {/* Organization Name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Organization Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Finance One"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>

                {/* Admin Email */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {/* Plan */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Plan
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as 'free' | 'pro' | 'enterprise')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Comped Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Comped (no billing)</p>
                    <p className="text-xs text-muted-foreground">
                      Bypass Stripe — grant full access without payment
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={comped}
                    onClick={() => setComped(!comped)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      comped ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        comped ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !adminSecret || !orgName || !adminEmail || !password}
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? 'Provisioning...' : 'Create Client'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
