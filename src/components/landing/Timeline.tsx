import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Flag, Milestone, Target, CheckCircle2 } from 'lucide-react';

const phases = [
  {
    phase: 'Phase 1',
    title: 'Strategy & Research',
    weeks: 'Weeks 1-2',
    items: ['Keyword research', 'Competitor audit', 'Campaign brief'],
    color: '#6366F1',
    icon: Target,
  },
  {
    phase: 'Phase 2',
    title: 'Content & Creative',
    weeks: 'Weeks 3-4',
    items: ['Ad copy generation', 'Landing page copy', 'Creative briefs'],
    color: '#22D3EE',
    icon: Milestone,
  },
  {
    phase: 'Phase 3',
    title: 'Launch & Optimise',
    weeks: 'Weeks 5-6',
    items: ['Campaign launch', 'A/B testing', 'Budget optimisation'],
    color: '#F59E0B',
    icon: Flag,
  },
  {
    phase: 'Phase 4',
    title: 'Report & Scale',
    weeks: 'Weeks 7-8',
    items: ['AI performance report', 'Scale winners', 'Next quarter plan'],
    color: '#34D399',
    icon: CheckCircle2,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="bg-[#06060E] py-28 px-6 overflow-hidden">
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
            Roadmap
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            See your entire marketing strategy
            <br />
            <span className="text-gradient">on a timeline</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-xl mx-auto">
            Campaign phases, milestones, and dependencies — all visible at a glance.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="relative"
        >
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-[28px] left-0 right-0 h-px">
            <div className="h-full bg-gradient-to-r from-indigo-500/40 via-cyan-500/30 via-amber-500/30 to-green-500/40" />
          </div>

          {/* Vertical line — mobile */}
          <div className="md:hidden absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-indigo-500/30 via-cyan-500/20 to-green-500/30" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
            {phases.map((phase) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.phase}
                  variants={cardVariant}
                  className="relative"
                >
                  {/* Timeline node */}
                  <div className="flex md:justify-center mb-4 md:mb-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center relative z-10"
                      style={{
                        background: `${phase.color}18`,
                        border: `2px solid ${phase.color}40`,
                        boxShadow: `0 0 16px ${phase.color}20`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: phase.color }} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="glass-card rounded-2xl p-5 ml-14 md:ml-0 group relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${phase.color}08, transparent 60%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="font-body text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: phase.color }}
                        >
                          {phase.phase}
                        </span>
                        <span className="font-body text-[10px] text-slate-600">
                          {phase.weeks}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-white mb-3">
                        {phase.title}
                      </h3>
                      <ul className="space-y-1.5">
                        {phase.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 font-body text-sm text-slate-400"
                          >
                            <div
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{ background: phase.color }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
