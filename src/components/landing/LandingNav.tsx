import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'AI Engine', href: '#ai-engine' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#06060E]/85 backdrop-blur-2xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-[17px] tracking-tight text-white">
            SYNTRA<span className="text-indigo-400">OS</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="font-body text-sm text-slate-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="font-body text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-[#06060E]/95 backdrop-blur-2xl border-b border-white/5"
          >
            <div className="px-6 py-5 space-y-5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-body text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-3 border-t border-white/5">
                <Link to="/login" className="font-body text-sm text-slate-400 hover:text-white">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="font-body text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-center"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
