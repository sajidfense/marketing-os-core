import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';

const insights = [
  {
    category: 'Budget Optimization',
    color: '#F59E0B',
    messages: [
      'Reallocate 23% of Campaign B spend → Campaign A. ROAS differential: 4.2× vs 1.8×.',
      'Campaign B is spending $340/day below threshold efficiency. Recommend pause or creative refresh.',
    ],
  },
  {
    category: 'Creative Fatigue',
    color: '#EF4444',
    messages: [
      'Ad Set #4 frequency reached 8.2 — 40% above safe threshold. Audience is tuning out.',
      'Top-performing creative (ID: 94021) shows 67% CTR decline week-over-week. Rotate now.',
    ],
  },
  {
    category: 'Audience Signal',
    color: '#34D399',
    messages: [
      'Lookalike 1% audience shows 2.1× better CPA vs Broad audience. Shift 35% of budget.',
      'Retargeting pool grew 18% this week — increase frequency cap from 3 to 5 for this segment.',
    ],
  },
  {
    category: 'Performance Alert',
    color: '#818CF8',
    messages: [
      'CPA improved 12.3% vs last week. Main driver: landing page A/B test variant B winning.',
      'iOS campaign underperforming Android by 38%. Consider reducing iOS budget allocation.',
    ],
  },
];

// ── Typewriter hook ─────────────────────────────────────────────────
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

// ── Terminal output line ────────────────────────────────────────────
function TerminalLine({ text, color }: { text: string; color: string }) {
  const { displayed, done } = useTypewriter(text, 22);

  return (
    <div className="font-mono text-sm text-slate-300 leading-relaxed">
      {displayed}
      {!done && (
        <span className="inline-block w-2 h-4 bg-indigo-400 ml-0.5 animate-blink align-text-bottom" />
      )}
    </div>
  );
}

export default function AIInsights() {
  const [activeInsight, setActiveInsight] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  // Auto-cycle insights every 6 seconds
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveInsight((prev) => {
        const next = (prev + 1) % insights.length;
        setMessageIdx(0);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [inView]);

  const current = insights[activeInsight];
  const currentMessage = current.messages[messageIdx];

  return (
    <section className="bg-[#08080F] py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-4">
            AI Intelligence
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight">
            AI that thinks like your CMO
            <br />
            <span className="text-gradient">acts like your analyst</span>
          </h2>
          <p className="font-body text-slate-400 mt-4 max-w-lg mx-auto text-base">
            Real-time insights generated from your actual data. Not templates — strategic analysis.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-[280px_1fr] gap-6"
        >
          {/* Category selector */}
          <div className="flex flex-col gap-2">
            {insights.map((ins, i) => (
              <motion.button
                key={ins.category}
                onClick={() => { setActiveInsight(i); setMessageIdx(0); }}
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                  activeInsight === i
                    ? 'bg-white/5 border border-white/10'
                    : 'hover:bg-white/3 border border-transparent'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 transition-all"
                  style={{
                    background: ins.color,
                    boxShadow: activeInsight === i ? `0 0 8px ${ins.color}` : 'none',
                  }}
                />
                <span className="font-body text-sm font-medium text-slate-300">{ins.category}</span>
                {activeInsight === i && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Terminal window */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-xs text-slate-500">syntra-ai — insights engine</span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-6 space-y-4 min-h-[200px]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-400">$</span>
                <span className="font-mono text-xs text-slate-500">
                  analyze --account=client_001 --category="{current.category.toLowerCase()}"
                </span>
              </div>

              <div className="flex gap-3">
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: current.color }}
                />
                <div className="space-y-1">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: current.color }}>
                    [{current.category}]
                  </p>
                  <motion.div key={`${activeInsight}-${messageIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <TerminalLine text={currentMessage} color={current.color} />
                  </motion.div>
                </div>
              </div>

              {/* Message selector dots */}
              {current.messages.length > 1 && (
                <div className="flex gap-2 pt-2">
                  {current.messages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMessageIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        messageIdx === i ? 'bg-indigo-400' : 'bg-white/15'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
