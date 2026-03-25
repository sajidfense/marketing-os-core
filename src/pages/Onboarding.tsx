import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Palette,
  Megaphone,
  Target,
  CheckCircle2,
  Zap,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
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

type Step = 'org' | 'campaign' | 'branding' | 'goals' | 'complete';

const STEPS: { id: Step; label: string; icon: typeof Building2 }[] = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'campaign', label: 'First Campaign', icon: Megaphone },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'goals', label: 'Goals', icon: Target },
];

const STEP_ORDER: Step[] = ['org', 'campaign', 'branding', 'goals', 'complete'];

// ── Step progress bar ─────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
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
        await refresh();
        onComplete(res.data.organization.id, res.data.organization.name);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already has org — skip ahead
        await refresh();
        onComplete('', name);
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

// ── Step 2: First Campaign ────────────────────────────────────────────
function StepCampaign({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('growth');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const campaignTypes = [
    { id: 'growth', label: 'Growth' },
    { id: 'brand-awareness', label: 'Brand Awareness' },
    { id: 'lead-generation', label: 'Lead Generation' },
    { id: 'product-launch', label: 'Product Launch' },
    { id: 'content-marketing', label: 'Content Marketing' },
    { id: 'other', label: 'Other' },
  ];

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/onboarding/steps/campaign', {
        name: name.trim(),
        type,
        goal: goal.trim() || undefined,
      });
      toast.success('Campaign created');
      onNext();
    } catch {
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Create your first campaign</h2>
        <p className="font-body text-sm text-slate-400">
          Start with a campaign to organize your marketing efforts. You can create more later.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="font-body text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q2 Growth Campaign"
            autoFocus
            className="w-full bg-white/4 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3.5 text-white font-body text-sm placeholder:text-slate-600 outline-none transition-all"
          />
        </div>

        <div>
          <label className="font-body text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {campaignTypes.map((ct) => (
              <button
                key={ct.id}
                type="button"
                onClick={() => setType(ct.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  type === ct.id
                    ? 'border-indigo-500/50 bg-indigo-600/15 text-indigo-300'
                    : 'border-white/8 text-slate-500 hover:text-white hover:border-white/15'
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-body text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Goal (optional)
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Increase signups by 30%"
            className="w-full bg-white/4 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-3.5 text-white font-body text-sm placeholder:text-slate-600 outline-none transition-all"
          />
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
          disabled={saving || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-body font-semibold py-3 rounded-xl transition-all"
        >
          {saving ? 'Creating...' : 'Continue'} {!saving && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Branding ─────────────────────────────────────────────────
function StepBranding({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [secondaryColor, setSecondaryColor] = useState('#22D3EE');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/onboarding/steps/branding', {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
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

// ── Step 4: Goals (optional) ──────────────────────────────────────────
const GOAL_OPTIONS = [
  'Increase brand awareness',
  'Generate more leads',
  'Grow social media following',
  'Improve SEO rankings',
  'Launch a product or service',
  'Increase email subscribers',
  'Boost paid ad ROI',
  'Create content at scale',
];

function StepGoals({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(goal: string) {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleSave() {
    if (selected.length === 0) {
      onNext();
      return;
    }
    setSaving(true);
    try {
      await api.post('/onboarding/steps/goals', { goals: selected });
    } catch {
      // Non-critical
    } finally {
      setSaving(false);
      onNext();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">What are your goals?</h2>
        <p className="font-body text-sm text-slate-400">
          Select your top priorities. We'll tailor your experience accordingly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selected.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggle(goal)}
              className={`text-left rounded-xl border px-3.5 py-3 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-indigo-500/50 bg-indigo-600/15 text-indigo-300'
                  : 'border-white/8 text-slate-500 hover:text-white hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2">
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                <span>{goal}</span>
              </div>
            </button>
          );
        })}
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
          {saving ? 'Saving...' : selected.length > 0 ? 'Continue' : 'Skip'}
          {!saving && <ArrowRight className="w-4 h-4" />}
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
          You're all set
        </h2>
        <p className="font-body text-sm text-slate-400">
          <span className="text-white font-medium">{orgName}</span> is ready to go.
          Your first campaign is waiting on the dashboard.
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
        {step !== 'complete' && <StepIndicator current={step} />}

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
            {step === 'campaign' && <StepCampaign onNext={goNext} onBack={goBack} />}
            {step === 'branding' && <StepBranding onNext={goNext} onBack={goBack} />}
            {step === 'goals' && <StepGoals onNext={goNext} onBack={goBack} />}
            {step === 'complete' && <StepComplete orgName={orgName} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
