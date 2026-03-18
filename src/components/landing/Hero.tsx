import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Play, TrendingUp, TrendingDown } from 'lucide-react';

// ── Animated floating stat cards ─────────────────────────────────────
const statCards = [
  {
    label: 'ROAS',
    value: '4.2×',
    change: '+12.3%',
    up: true,
    color: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
    floatClass: 'animate-float-a',
    position: 'top-[18%] right-[3%] md:right-[8%]',
  },
  {
    label: 'CPA',
    value: '$18.40',
    change: '−8.1%',
    up: false,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    floatClass: 'animate-float-b',
    position: 'top-[50%] right-[1%] md:right-[5%]',
  },
  {
    label: 'Impressions',
    value: '2.4M',
    change: '+31.2%',
    up: true,
    color: '#818CF8',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.2)',
    floatClass: 'animate-float-c',
    position: 'bottom-[22%] right-[3%] md:right-[9%]',
  },
];

// ── Staggered container ───────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 30 });

  // Orb follows the cursor subtly
  const orbX = useTransform(springX, [0, 1], ['-20%', '20%']);
  const orbY = useTransform(springY, [0, 1], ['-15%', '15%']);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#06060E] grid-bg"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Radial gradient ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={{
            x: orbX,
            y: orbY,
            background:
              'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(34,211,238,0.06) 50%, transparent 70%)',
          }}
          className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[120px] animate-pulse-glow"
        />
        {/* Bottom edge glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Floating stat cards — desktop only */}
      {statCards.map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className={`absolute hidden lg:flex flex-col gap-1.5 px-4 py-3 rounded-xl backdrop-blur-md cursor-default select-none ${card.floatClass} ${card.position}`}
          style={{
            background: card.bg,
            border: `1px solid ${card.border}`,
            minWidth: 130,
          }}
        >
          <span className="font-body text-[11px] font-medium text-white/40 uppercase tracking-widest">
            {card.label}
          </span>
          <div className="flex items-end gap-2">
            <span className="font-display text-2xl font-bold text-white">{card.value}</span>
            <div
              className="flex items-center gap-0.5 text-xs font-semibold mb-0.5"
              style={{ color: card.color }}
            >
              {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {card.change}
            </div>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-0.5 h-5 mt-0.5">
            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${h}%`,
                  background:
                    i === 6
                      ? card.color
                      : `${card.color}44`,
                }}
              />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered Marketing Intelligence
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={item}
          className="font-display font-extrabold text-[clamp(2.8rem,7vw,6rem)] leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-white block">Turn Your Ad Data</span>
          <span className="text-gradient block">Into Board-Level</span>
          <span className="text-white block">Decisions</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={item}
          className="font-body text-[clamp(1rem,2.5vw,1.25rem)] text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered marketing OS that analyzes your Meta Ads, writes executive reports,
          and tells you{' '}
          <span className="text-white font-medium">exactly what to do next</span> — automatically.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-body font-semibold text-base px-8 py-4 rounded-xl transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-500/40"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="group inline-flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-white font-body font-medium text-base px-8 py-4 rounded-xl transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </div>
            View Demo
          </Link>
        </motion.div>

        {/* Social proof micro-line */}
        <motion.p
          variants={item}
          className="font-body text-sm text-slate-600 mt-8"
        >
          No credit card required · 14-day free trial · Cancel anytime
        </motion.p>
      </motion.div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-indigo-400/0 via-indigo-400/60 to-indigo-400/0 animate-pulse" />
      </motion.div>
    </section>
  );
}
