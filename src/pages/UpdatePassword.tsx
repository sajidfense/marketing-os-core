import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Zap, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm || password.length < 8) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary mb-4">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {done ? 'Password updated' : 'Set a new password'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {done ? 'Redirecting you to the dashboard...' : 'Enter your new password below'}
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/50 p-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm text-center text-muted-foreground">
              Your password has been updated. You'll be redirected shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
              />
              {tooShort && (
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
              <Input
                id="confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              {mismatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={loading || password.length < 8 || password !== confirm}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
