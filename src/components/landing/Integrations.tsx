import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const integrations = [
  {
    name: 'Meta Ads',
    description: 'Connect your ad accounts. Pull ROAS, CPA, and creative performance in real-time.',
    color: '#6366F1',
    status: 'Live',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
      </svg>
    ),
  },
  {
    name: 'Google Ads',
    description: 'Import campaign data for cross-platform analysis and unified reporting.',
    color: '#F59E0B',
    status: 'Coming Soon',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
      </svg>
    ),
  },
  {
    name: 'SEMrush',
    description: 'Pull keyword rankings, backlink data, and competitive intelligence into your workspace.',
    color: '#22D3EE',
    status: 'Coming Soon',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M21 21H3V3h18v18ZM5 19h14V5H5v14Zm2-2h10V7H7v10Zm2-2h6V9H9v6Z" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function Integrations() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="integrations" className="bg-[#08080F] py-28 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">
            Integrations
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            Connect your data.
            <br />
            <span className="text-gradient">Get real insights.</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-lg mx-auto">
            Syntra OS pulls data from the platforms you already use — so your
            analytics and AI recommendations are based on real numbers.
          </p>
        </motion.div>

        {/* Integration cards */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {integrations.map((intg) => (
            <motion.div
              key={intg.name}
              variants={cardVariant}
              whileHover={{ y: -6 }}
              className="glass-card rounded-2xl p-7 group relative overflow-hidden"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${intg.color}10, transparent 60%)`,
                }}
              />

              <div className="relative z-10">
                {/* Logo + status */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `${intg.color}10`,
                      border: `1px solid ${intg.color}20`,
                      color: intg.color,
                    }}
                  >
                    {intg.logo}
                  </div>
                  <span
                    className={`font-body text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      intg.status === 'Live'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {intg.status}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-white mb-2">
                  {intg.name}
                </h3>
                <p className="font-body text-sm text-slate-400 leading-relaxed">
                  {intg.description}
                </p>
              </div>

              <div
                className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${intg.color}50, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
