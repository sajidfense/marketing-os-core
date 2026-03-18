import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/services/ai';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 97, annual: 79 },
    description: 'For freelancers and solo operators managing 1–3 client accounts.',
    badge: null,
    accent: '#6366F1',
    features: [
      'Up to 3 connected accounts',
      'Monthly AI reports',
      'Core Web Vitals & SEO audit',
      'Campaign performance tracking',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 247, annual: 197 },
    description: 'For growing agencies ready to scale client reporting and retention.',
    badge: 'Most Popular',
    accent: '#22D3EE',
    features: [
      'Up to 15 connected accounts',
      'Weekly AI reports (automated)',
      'White-label PDF exports',
      'Advanced budget optimization',
      'Creative fatigue detection',
      'Priority support',
      'Custom branding & domain',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: { monthly: 597, annual: 497 },
    description: 'For established agencies with high-volume reporting requirements.',
    badge: null,
    accent: '#34D399',
    features: [
      'Unlimited connected accounts',
      'Daily AI reports (automated)',
      'Multi-org white-label',
      'API access',
      'Advanced analytics & attribution',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();

  async function handleSelect(planId: string) {
    const orgId = localStorage.getItem('currentOrganizationId') ?? '';

    if (!orgId) {
      // Not logged in — send to signup
      navigate('/signup');
      return;
    }

    setLoading(planId);
    try {
      const { url } = await createCheckoutSession(
        annual ? `${planId}_annual` : planId,
        orgId,
      );
      window.location.href = url;
    } catch {
      toast.error('Could not start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="bg-[#06060E] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-green-400 mb-4">
            Pricing
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            Straightforward pricing.
            <br />
            <span className="text-gradient">No surprises.</span>
          </h2>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white/4 border border-white/8 rounded-full px-5 py-2.5 mt-4">
            <button
              onClick={() => setAnnual(false)}
              className={`font-body text-sm transition-colors ${!annual ? 'text-white font-semibold' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`font-body text-sm transition-colors ${annual ? 'text-white font-semibold' : 'text-slate-500'}`}
            >
              Annual
              <span className="ml-1.5 text-xs font-semibold text-green-400">Save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="grid md:grid-cols-3 gap-6"
        >
          {plans.map((plan, i) => {
            const isPro = plan.id === 'pro';
            const price = annual ? plan.price.annual : plan.price.monthly;
            const isLoading = loading === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: isPro ? 0 : -6 }}
                className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
                  isPro
                    ? 'border-2'
                    : 'border glass-card'
                }`}
                style={
                  isPro
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(99,102,241,0.06) 100%)',
                        borderColor: 'rgba(34,211,238,0.35)',
                        boxShadow:
                          '0 0 0 1px rgba(34,211,238,0.1), 0 30px 80px rgba(34,211,238,0.08)',
                      }
                    : {}
                }
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 bg-cyan-500 text-white text-xs font-semibold font-body px-3 py-1 rounded-full shadow-lg shadow-cyan-500/30">
                      <Zap className="w-3 h-3" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Plan name + description */}
                <div>
                  <p className="font-display font-bold text-xl text-white mb-1">{plan.name}</p>
                  <p className="font-body text-sm text-slate-400 leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-5xl text-white">${price}</span>
                  <span className="font-body text-slate-500 text-sm">/mo{annual ? ' · billed annually' : ''}</span>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${plan.accent}20` }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: plan.accent }} />
                      </div>
                      <span className="font-body text-sm text-slate-300">{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-body font-semibold text-sm transition-all ${
                    isPro
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-[#06060E] shadow-lg shadow-cyan-500/25'
                      : 'bg-white/6 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isLoading ? 'Redirecting...' : 'Start Free Trial'}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom note */}
        <p className="text-center font-body text-sm text-slate-600 mt-8">
          All plans include a 14-day free trial. No credit card required to start.{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Get started free →
          </Link>
        </p>
      </div>
    </section>
  );
}
