import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminAccess() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
      const res = await fetch(`${apiUrl}/admin/magic-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Admin login failed');

      const { access_token, refresh_token } = json.data;
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;

      toast.success('Admin access granted');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      setSecret('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15">
            <ShieldCheck className="h-5 w-5 text-red-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter the admin secret to bypass login.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
            autoFocus
            autoComplete="off"
          />
          <Button type="submit" variant="destructive" className="w-full gap-2" disabled={loading || !secret}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
