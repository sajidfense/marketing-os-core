import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

const painPoints = [
  {
    tool: 'Notion',
    pain: 'Strategy docs nobody reads',
    color: '#F59E0B',
  },
  {
    tool: 'Google Sheets',
    pain: 'Content calendars that break',
    color: '#34D399',
  },
  {
    tool: 'Meta Ads Manager',
    pain: 'Scattered campaign data',
    color: '#6366F1',
  },
  {
    tool: 'SEMrush',
    pain: 'Expensive audits, no action',
    color: '#22D3EE',
  },
  {
    tool: 'Canva',
    pain: 'Assets everywhere',
    color: '#EF4444',
  },
  {
    tool: 'Slack / Email',
    pain: 'Status updates lost in threads',
    color: '#A78BFA',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="bg-[#08080F] py-28 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-red-400 mb-4">
            The Problem
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            Your marketing stack is
            <br />
            <span className="text-gradient">held together by duct tape</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Six tools. Zero alignment. No single source of truth between
            strategy and execution.
          </p>
        </motion.div>

        {/* Pain point grid */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12"
        >
          {painPoints.map((point) => (
            <motion.div
              key={point.tool}
              variants={cardVariant}
              className="glass-card rounded-2xl p-5 group relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${point.color}10, transparent 60%)`,
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-body text-xs font-semibold uppercase tracking-wider"
                    style={{ color: point.color }}
                  >
                    {point.tool}
                  </span>
                  <X className="w-3.5 h-3.5 text-red-500/40" />
                </div>
                <p className="font-body text-sm text-slate-400 leading-relaxed">
                  {point.pain}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Transition arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-px h-12 bg-gradient-to-b from-red-500/30 via-indigo-500/30 to-cyan-500/30" />
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full font-body">
            <ArrowRight className="w-3 h-3" />
            There&apos;s a better way
          </div>
        </motion.div>
      </div>
    </section>
  );
}
