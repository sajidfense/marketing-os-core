import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { BarChart3, Lightbulb, FileText, LayoutDashboard, Activity } from 'lucide-react';

const features = [
  {
    id: 'reports',
    icon: FileText,
    title: 'AI Board Reports',
    summary: 'Executive-ready PDFs in seconds.',
    detail:
      'Claude AI writes strategic narratives from your ad data. Section-by-section analysis, key takeaways, and prioritized recommendations — white-labeled with your agency branding. Send to clients with one click.',
    accent: '#6366F1',
    span: 'col-span-2',
  },
  {
    id: 'insights',
    icon: Lightbulb,
    title: 'Campaign Insights',
    summary: 'Know exactly what to fix.',
    detail:
      'AI surfaces what\'s draining budget and what\'s performing. Budget reallocation signals, creative fatigue alerts, and audience decay detection — before they impact results.',
    accent: '#F59E0B',
    span: 'col-span-1',
  },
  {
    id: 'whitelabel',
    icon: LayoutDashboard,
    title: 'White-Label Ready',
    summary: 'Your brand, your platform.',
    detail:
      'Full white-label reports with custom logos, brand colors, and domain. Clients see your brand — not ours. Perfect for agencies managing 10+ client accounts.',
    accent: '#22D3EE',
    span: 'col-span-1',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Multi-Account Dashboard',
    summary: 'Every client in one view.',
    detail:
      'Switch between client organizations instantly. Consolidated performance overview with drill-down into any account, campaign, or ad set — all in one workspace.',
    accent: '#34D399',
    span: 'col-span-1',
  },
  {
    id: 'tracking',
    icon: Activity,
    title: 'Daily Performance Tracking',
    summary: 'Automated daily snapshots.',
    detail:
      'Automatic daily data snapshots with trend detection. Get notified when performance changes materially. Catch issues same-day instead of end-of-week.',
    accent: '#A78BFA',
    span: 'col-span-2',
  },
];

export default function Features() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="bg-[#08080F] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">
            Features
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight">
            Everything you need to{' '}
            <br className="hidden md:block" />
            <span className="text-gradient">dominate performance marketing</span>
          </h2>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const isExpanded = expanded === feat.id;

            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setExpanded(isExpanded ? null : feat.id)}
                className={`${feat.span} glass-card rounded-2xl p-7 cursor-pointer relative overflow-hidden group`}
                whileHover={{ scale: 1.01 }}
              >
                {/* Glow behind icon on hover */}
                <div
                  className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{ background: `${feat.accent}20` }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${feat.accent}15`, border: `1px solid ${feat.accent}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feat.accent }} />
                  </div>

                  {/* Title + summary */}
                  <h3 className="font-display font-bold text-lg text-white mb-1.5">{feat.title}</h3>
                  <p className="font-body text-sm text-slate-400">{feat.summary}</p>

                  {/* Expandable detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="font-body text-sm text-slate-300 leading-relaxed overflow-hidden"
                      >
                        {feat.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Expand caret */}
                  <div className="mt-4 flex items-center gap-1.5">
                    <span
                      className="font-body text-xs font-semibold transition-colors"
                      style={{ color: isExpanded ? feat.accent : '#475569' }}
                    >
                      {isExpanded ? 'Close' : 'Learn more'}
                    </span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-slate-600 text-xs"
                    >
                      ↓
                    </motion.span>
                  </div>
                </div>

                {/* Bottom border glow */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feat.accent}60, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
