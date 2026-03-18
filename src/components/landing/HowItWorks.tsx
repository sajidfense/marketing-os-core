import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Share2, Cpu, FileText } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Share2,
    title: 'Connect Meta Ads',
    description:
      'OAuth in one click. Syntra OS syncs your campaigns, ad sets, creatives, and spend data in real-time — no spreadsheet exports, no copy-paste.',
    accent: '#6366F1',
    glowColor: 'rgba(99,102,241,0.15)',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Analyzes Performance',
    description:
      'Our AI engine processes every signal — ROAS trends, creative fatigue, audience decay, budget efficiency — and identifies what needs attention first.',
    accent: '#22D3EE',
    glowColor: 'rgba(34,211,238,0.15)',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Generate Executive Reports',
    description:
      'Board-ready PDFs, white-labeled with your brand. Strategic narrative, data visuals, and prioritized recommendations — delivered automatically.',
    accent: '#34D399',
    glowColor: 'rgba(52,211,153,0.15)',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="bg-[#06060E] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-4">
            How it Works
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight">
            From raw data to boardroom
            <br />
            <span className="text-gradient">in three steps</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-indigo-500/40 via-cyan-500/40 to-green-500/40" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={cardVariant}
                className="glass-card rounded-2xl p-8 flex flex-col gap-5 group relative overflow-hidden"
              >
                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${step.glowColor}, transparent 60%)` }}
                />

                {/* Step number + icon */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${step.accent}18`, border: `1px solid ${step.accent}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: step.accent }} />
                  </div>
                  <span
                    className="font-display font-black text-4xl opacity-20 tracking-tighter select-none"
                    style={{ color: step.accent }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-display font-bold text-xl text-white mb-3">{step.title}</h3>
                  <p className="font-body text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.accent}80, transparent)` }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
