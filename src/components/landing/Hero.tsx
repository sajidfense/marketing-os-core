import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Calendar,
  BarChart3,
  Brain,
  Layers,
  Target,
} from 'lucide-react';

const floatingPanels = [
  {
    icon: Calendar,
    label: 'Content Calendar',
    detail: '12 posts scheduled',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
    floatClass: 'animate-float-a',
    position: 'top-[18%] right-[2%] md:right-[6%]',
  },
  {
    icon: Brain,
    label: 'AI Engine',
    detail: '3 outputs generated',
    color: '#818CF8',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.2)',
    floatClass: 'animate-float-b',
    position: 'top-[52%] right-[0%] md:right-[3%]',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    detail: 'ROAS 4.2x',
    color: '#22D3EE',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.2)',
    floatClass: 'animate-float-c',
    position: 'bottom-[24%] right-[2%] md:right-[7%]',
  },
  {
    icon: Target,
    label: 'Campaign Planner',
    detail: '2 active campaigns',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    floatClass: 'animate-float-a',
    position: 'top-[28%] left-[2%] md:left-[6%]',
  },
  {
    icon: Layers,
    label: 'Brand Vault',
    detail: '48 assets stored',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    floatClass: 'animate-float-c',
    position: 'bottom-[28%] left-[1%] md:left-[5%]',
  },
];

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
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Floating UI panels — desktop only */}
      {floatingPanels.map((panel) => {
        const Icon = panel.icon;
        return (
          <motion.div
            key={panel.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className={`absolute hidden lg:flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md cursor-default select-none ${panel.floatClass} ${panel.position}`}
            style={{
              background: panel.bg,
              border: `1px solid ${panel.border}`,
              minWidth: 160,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${panel.color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: panel.color }} />
            </div>
            <div>
              <span className="font-body text-[11px] font-semibold text-white/80 block leading-tight">
                {panel.label}
              </span>
              <span className="font-body text-[10px] text-white/40">{panel.detail}</span>
            </div>
          </motion.div>
        );
      })}

      {/* Main content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={item} className="inline-flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            The Marketing Operating System
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={item}
          className="font-display font-extrabold text-[clamp(2.6rem,6.5vw,5.5rem)] leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-white block">Run Your Entire</span>
          <span className="text-white block">Marketing System</span>
          <span className="text-gradient block">From One Platform</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={item}
          className="font-body text-[clamp(1rem,2.5vw,1.25rem)] text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Plan campaigns, manage content, track performance, and generate
          AI-powered outputs — all in Syntra OS. Replace your entire marketing
          stack with{' '}
          <span className="text-white font-medium">one unified workspace</span>.
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

        {/* Reassurance */}
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
