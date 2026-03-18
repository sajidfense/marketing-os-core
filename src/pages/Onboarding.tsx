import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Palette, Share2, CreditCard, CheckCircle2, Zap, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { api, ApiError } from '@/services/api';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────
interface OnboardingResult {
  organization: { id: string; name: string; slug: string };
  membership: { organization_id: string; user_id: string; role: string };
}

type Step = 'org' | 'branding' | 'meta' | 'plan' | 'complete';

const STEPS: { id: Step; label: string; icon: typeof Building2 }[] = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'meta', label: 'Connect Meta', icon: Share2 },
  { id: 'plan', label: 'Choose Plan', icon: CreditCard },
];

const STEP_ORDER: Step[] = ['org', 'branding', 'meta', 'plan', 'complete'];

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Step progress bar ─────────────────────────────────────────────────
function StepIndicator({ current, orgId }: { current: Step; orgId: string }) {
  const activeIdx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-12">
      {STEPS.map((step, i) => {
        const status = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'upcoming';
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'done'
                    ? 'bg-green-500/20 border border-green-500/40'
                    : status === 'active'
                    ? 'bg-indigo-600/30 border border-indigo-500/50'
                    : 'bg-white/3 border border-white/8'
                }`}
              >
                {status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Icon
                    className={`w-4.5 h-4.5 ${status === 'active' ? 'text-indigo-400' : 'text-slate-600'}`}
                  />
                )}
              </div>
              <span
                className={`font-body text-xs hidden sm:block ${
                  status === 'active' ? 'text-white font-medium' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 mb-5 h-px transition-all duration-500"
                style={{
                  background: i < activeIdx
                    ? 'linear-gradient(90deg, #22c55e60, #6366F160)'
                    : 'rgba(255,255,255,0.06)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Organization ──────────────────────────────────────────────
function StepOrg({ onComplete }: { onComplete: (orgId: string, orgName: string) => void }) {
  const { user } = useAuth();
  const { refresh } = useOrg();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<OnboardingResult>>('/onboarding/organization', {
        name: name.trim(),
      });
      if (res.success && res.data) {
        localStorage.setItem('currentOrganizationId', res.data.organization.id);
        await refresh();
        onComplete(res.data.organization.id, res.data.organization.name);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const orgId = localStorage.getItem('currentOrganizationId') ?? '';
        onComplete(orgId, name);
        return;
      }
      toast.error(err instanceof ApiError ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Name your workspace</h2>
        <p className="font-body text-sm text-slate-400">
          Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          This is your organization — your clients and data live here.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Marketing Agency"
            required
            minLength={2}
            maxLength={100}
            autoFocus
            className="w-full bg-white/4 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3.5 text-white font-body text-sm placeholder:text-slate-600 outline-none transition-all"
          />
          <p className="font-body text-xs text-slate-600 mt-2">
            Use your agency or company name. You can change it later.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-body font-semibold py-3.5 rounded-xl transition-all"
        >
          {loading ? 'Creating...' : 'Continue'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

// ── Step 2: Branding ─────────────────────────────────────────────────
function StepBranding({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [secondaryColor, setSecondaryColor] = useState('#22D3EE');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const orgId = localStorage.getItem('currentOrganizationId') ?? '';
    try {
      await fetch(`${API_URL}/branding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-organization-id': orgId },
        body: JSON.stringify({ primary_color: primaryColor, secondary_color: secondaryColor }),
      });
    } catch {
      // Non-critical — continue anyway
    } finally {
      setSaving(false);
      onNext();
    }
  }

  const presets = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Brand your platform</h2>
        <p className="font-body text-sm text-slate-400">
          Set your colors for white-label reports. Clients will see your brand — not ours.
        </p>
      </div>

      {/* Color preview */}
      <div
        className="h-20 rounded-xl flex items-center justify-center font-display font-bold text-white text-xl tracking-tight transition-all"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        YOUR AGENCY
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Primary Color', value: primaryColor, set: setPrimaryColor },
          { label: 'Secondary Color', value: secondaryColor, set: setSecondaryColor },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="font-body text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
              {label}
            </label>
            <div className="flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl p-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden relative">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="absolute inset-0 w-[200%] h-[200%] cursor-pointer opacity-0"
                />
                <div className="w-full h-full rounded-lg" style={{ background: value }} />
              </div>
              <span className="font-mono text-sm text-white">{value.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Color presets */}
      <div>
        <p className="font-body text-xs text-slate-600 mb-2">Quick presets</p>
        <div className="flex gap-2 flex-wrap">
          {presets.map((c) => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background: c,
                borderColor: primaryColor === c ? 'white' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-body text-sm text-slate-400 hover:text-white border border-white/8 hover:border-white/15 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-body font-semibold py-3 rounded-xl transition-all"
        >
          {saving ? 'Saving...' : 'Continue'} {!saving && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Meta connection ───────────────────────────────────────────
function StepMeta({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Connect Meta Ads</h2>
        <p className="font-body text-sm text-slate-400">
          Authorize Syntra OS to pull your campaign data. Read-only access — we never modify your ads.
        </p>
      </div>

      {/* Meta card */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1877F2]/15 border border-[#1877F2]/25 flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div>
            <p className="font-body font-semibold text-white">Meta Business Suite</p>
            <p className="font-body text-sm text-slate-400">Facebook & Instagram Ads</p>
          </div>
        </div>
        <ul className="space-y-2">
          {[
            'Read campaign performance data',
            'Access ad set and creative metrics',
            'View audience insights',
          ].map((p) => (
            <li key={p} className="flex items-center gap-2 font-body text-sm text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
        <a
          href={`${API_URL}/meta/oauth/start`}
          className="flex items-center justify-center gap-2 w-full bg-[#1877F2] hover:bg-[#1461c7] text-white font-body font-semibold py-3.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Connect with Facebook
        </a>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-body text-sm text-slate-400 hover:text-white border border-white/8 hover:border-white/15 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-white/6 hover:bg-white/10 text-white font-body font-medium py-3 rounded-xl border border-white/10 transition-all"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Plan selection ────────────────────────────────────────────
const MINI_PLANS = [
  { id: 'starter', name: 'Starter', price: 97, features: ['3 accounts', 'Monthly reports', 'SEO audit'] },
  { id: 'pro', name: 'Pro', price: 247, badge: 'Popular', features: ['15 accounts', 'Weekly reports', 'White-label PDFs'] },
  { id: 'agency', name: 'Agency', price: 597, features: ['Unlimited accounts', 'Daily reports', 'API access'] },
];

function StepPlan({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const { session } = useAuth();

  async function handleSelect(planId: string) {
    const orgId = localStorage.getItem('currentOrganizationId') ?? '';
    setLoading(planId);
    try {
      const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          'x-organization-id': orgId,
        },
        body: JSON.stringify({ plan_id: planId, organization_id: orgId }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Choose your plan</h2>
        <p className="font-body text-sm text-slate-400">
          14-day free trial on all plans. Cancel anytime.
        </p>
      </div>

      <div className="space-y-3">
        {MINI_PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.01 }}
            className={`relative rounded-xl p-4 flex items-center justify-between cursor-pointer border transition-all ${
              plan.badge
                ? 'border-indigo-500/40 bg-indigo-600/8'
                : 'border-white/8 bg-white/3 hover:border-white/15'
            }`}
            onClick={() => handleSelect(plan.id)}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-semibold font-body px-2.5 py-0.5 rounded-full">
                {plan.badge}
              </div>
            )}
            <div>
              <p className="font-display font-bold text-white">{plan.name}</p>
              <p className="font-body text-xs text-slate-500">{plan.features.join(' · ')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-display font-bold text-xl text-white">${plan.price}</p>
                <p className="font-body text-xs text-slate-500">/mo</p>
              </div>
              <button
                disabled={loading === plan.id}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-body text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === plan.id ? '...' : 'Select'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-body text-sm text-slate-400 hover:text-white border border-white/8 hover:border-white/15 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onComplete}
          className="flex-1 flex items-center justify-center gap-2 text-slate-500 hover:text-white font-body text-sm py-3 transition-colors"
        >
          Skip — I'll choose later
        </button>
      </div>
    </div>
  );
}

// ── Step 5: Complete ──────────────────────────────────────────────────
function StepComplete({ orgName }: { orgName: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="text-center space-y-6 py-4"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">
          Your AI Marketing OS is ready
        </h2>
        <p className="font-body text-sm text-slate-400">
          <span className="text-white font-medium">{orgName}</span> is all set.
          Connect Meta Ads and generate your first AI report in minutes.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-body font-semibold py-3.5 rounded-xl transition-all"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState<Step>('org');
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');

  const stepIdx = STEP_ORDER.indexOf(step);
  const dir = 1;

  function goNext() {
    const next = STEP_ORDER[stepIdx + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = STEP_ORDER[stepIdx - 1];
    if (prev) setStep(prev);
  }

  const pageVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div
      className="min-h-screen bg-[#06060E] grid-bg flex flex-col items-center justify-center px-4 py-12"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="font-display font-bold text-xl text-white">
          SYNTRA<span className="text-indigo-400">OS</span>
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-lg rounded-2xl p-8 md:p-10"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Step indicator (not shown on complete screen) */}
        {step !== 'complete' && <StepIndicator current={step} orgId={orgId} />}

        {/* Animated step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 'org' && (
              <StepOrg
                onComplete={(id, name) => {
                  setOrgId(id);
                  setOrgName(name);
                  goNext();
                }}
              />
            )}
            {step === 'branding' && <StepBranding onNext={goNext} onBack={goBack} />}
            {step === 'meta' && <StepMeta onNext={goNext} onBack={goBack} />}
            {step === 'plan' && <StepPlan onBack={goBack} onComplete={goNext} />}
            {step === 'complete' && <StepComplete orgName={orgName} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
