import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, TrendingUp, RefreshCw } from 'lucide-react';

function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / (duration * 1000);
      if (elapsed >= 1) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.round(target * elapsed));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function CreditSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const used = 320;
  const total = 500;
  const pct = (used / total) * 100;

  return (
    <section className="bg-[#06060E] py-28 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-green-400 mb-4">
            Credit System
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            AI usage that
            <br />
            <span className="text-gradient">scales with you</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-lg mx-auto">
            Every plan includes monthly AI credits. Use them for ad copy,
            reports, SEO audits, and more. Need more? Buy additional credits
            anytime.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Credit meter visual */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-body text-xs text-slate-500 uppercase tracking-widest mb-1">
                  Monthly Usage
                </p>
                <p className="font-display font-bold text-2xl text-white">
                  <AnimatedCounter target={used} /> / {total}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
              >
                <Zap className="w-4.5 h-4.5 text-green-400" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : {}}
                transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #6366F1, #22D3EE, #34D399)',
                }}
              />
            </div>

            <p className="font-body text-xs text-slate-500">
              {total - used} credits remaining · Resets in 18 days
            </p>

            {/* Recent usage */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
              {[
                { skill: 'SEO Analysis', cost: 3, time: '2 hours ago' },
                { skill: 'Ad Copy', cost: 1, time: '5 hours ago' },
                { skill: 'Video Script', cost: 2, time: 'Yesterday' },
              ].map((tx) => (
                <div key={tx.skill} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="font-body text-sm text-slate-300">{tx.skill}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-slate-600">{tx.time}</span>
                    <span className="font-body text-xs font-semibold text-white/60">
                      -{tx.cost} cr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-5">
            {[
              {
                icon: Zap,
                title: 'Credits included in every plan',
                detail:
                  'Starter gets 500 credits/mo. Pro gets 2,000. Agency gets 10,000. Every AI action has a transparent cost.',
                color: '#6366F1',
              },
              {
                icon: TrendingUp,
                title: 'Track usage in real-time',
                detail:
                  "See exactly how many credits you've used, what you used them on, and when your balance resets.",
                color: '#22D3EE',
              },
              {
                icon: RefreshCw,
                title: 'Buy more when you need them',
                detail:
                  'Running a big campaign? Purchase additional credit packs anytime — no plan upgrade required.',
                color: '#34D399',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 p-4 rounded-xl hover:bg-white/3 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${item.color}12`,
                      border: `1px solid ${item.color}22`,
                    }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="font-body text-sm text-slate-400 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
