import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Zap } from 'lucide-react';

const reassurances = [
  { icon: Shield, text: '14-day free trial' },
  { icon: Clock, text: 'Setup in 5 minutes' },
  { icon: Zap, text: 'No credit card required' },
];

export default function FinalCTA() {
  return (
    <section className="relative bg-[#06060E] py-32 px-6 overflow-hidden">
      {/* Full-bleed gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400 mb-6">
            Get Started Today
          </p>

          {/* Headline */}
          <h2 className="font-display font-extrabold text-[clamp(2.2rem,6vw,4.5rem)] text-white leading-[1.05] tracking-tight mb-6">
            Start Your Free Trial
            <br />
            <span className="text-gradient">Today</span>
          </h2>

          {/* Sub */}
          <p className="font-body text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Join performance-driven marketing teams using Syntra OS to turn ad data
            into decisions that move the needle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-body font-semibold text-base px-10 py-4 rounded-xl transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-500/40"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center font-body font-medium text-base text-slate-400 hover:text-white transition-colors px-8 py-4"
            >
              Already have an account →
            </Link>
          </div>

          {/* Reassurances */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {reassurances.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-slate-500">
                <Icon className="w-4 h-4 text-slate-600" />
                <span className="font-body text-sm">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-6xl mx-auto mt-24 pt-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-base text-white">
              SYNTRA<span className="text-indigo-400">OS</span>
            </span>
          </div>
          <p className="font-body text-sm text-slate-600">
            © {new Date().getFullYear()} Syntra OS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="font-body text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="font-body text-xs text-slate-600 hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}
