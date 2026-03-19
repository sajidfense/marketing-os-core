import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

const examples = [
  {
    label: 'Ad Copy',
    color: '#F59E0B',
    prompt: 'Write a high-converting Meta ad for a fitness app targeting 25-34 year olds',
    output: `🎯 **Primary Text**
Stop scrolling. Your 6-week transformation starts today.

Join 40,000+ people who ditched the gym confusion and started seeing real results with AI-powered workout plans that adapt to YOUR body.

✅ Personalised daily workouts
✅ Nutrition tracking built in
✅ Progress photos + measurements

Download free. Cancel anytime.

👉 Tap "Get Started" — your future self will thank you.`,
  },
  {
    label: 'Video Script',
    color: '#22D3EE',
    prompt: 'Write a 30s TikTok script for a SaaS product launch',
    output: `[HOOK — 0-3s]
"This one tool replaced our entire marketing stack."

[PROBLEM — 3-10s]
We were using Notion for strategy, Sheets for calendars, 3 different analytics dashboards...

[SOLUTION — 10-20s]
Then we switched to Syntra OS. Campaign planning, AI content, analytics — one platform.

[PROOF — 20-25s]
Our team saved 12 hours a week. ROAS went up 34%.

[CTA — 25-30s]
Link in bio. 14-day free trial. No credit card.`,
  },
  {
    label: 'SEO Recommendations',
    color: '#34D399',
    prompt: 'Analyse homepage SEO for example.com',
    output: `## Priority Fixes

1. **Title tag too long** (72 chars → target 60)
   Current: "Example | The Best Platform For Everything You Need"
   Suggested: "Example | All-in-One Marketing Platform"

2. **Missing H1** — page uses H2 as primary heading
   Action: Wrap hero headline in <h1>

3. **LCP: 4.2s** (target < 2.5s)
   Cause: Hero image is 2.4MB uncompressed PNG
   Fix: Convert to WebP, add width/height, lazy-load below fold

4. **No internal links** to /pricing or /features from homepage
   Add contextual links in hero and feature sections`,
  },
  {
    label: 'Social Captions',
    color: '#A78BFA',
    prompt: 'Write 3 LinkedIn post hooks for a B2B SaaS launch',
    output: `**Hook 1 — Contrarian**
"We spent $40K on marketing tools last year. This year we spend $3K. Here's what changed."

**Hook 2 — Story**
"Last Tuesday our CMO asked: 'Why do we have 11 marketing tools and still no visibility?' That conversation changed everything."

**Hook 3 — Data**
"We reduced our marketing stack from 8 tools to 1. Result: 12 hours/week saved. 34% higher ROAS. 0 spreadsheets."

All three follow the pattern: specific number + unexpected outcome + curiosity gap.`,
  },
];

function useTypewriter(text: string, speed = 16) {
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

function OutputPreview({ text }: { text: string }) {
  const { displayed, done } = useTypewriter(text, 12);

  return (
    <div className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
      {displayed}
      {!done && (
        <span className="inline-block w-2 h-4 bg-indigo-400 ml-0.5 animate-blink align-text-bottom" />
      )}
    </div>
  );
}

export default function AIEngine() {
  const [activeExample, setActiveExample] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveExample((prev) => (prev + 1) % examples.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [inView]);

  const current = examples[activeExample];

  return (
    <section id="ai-engine" className="bg-[#08080F] py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4">
            AI Engine
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            AI that actually
            <br />
            <span className="text-gradient">does the work</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-lg mx-auto">
            Not templates. Not suggestions. Real outputs you can use immediately —
            ad copy, scripts, reports, and more.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-[240px_1fr] gap-6"
        >
          {/* Example selector */}
          <div className="flex md:flex-col gap-2">
            {examples.map((ex, i) => (
              <motion.button
                key={ex.label}
                onClick={() => setActiveExample(i)}
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 w-full ${
                  activeExample === i
                    ? 'bg-white/5 border border-white/10'
                    : 'hover:bg-white/3 border border-transparent'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 transition-all"
                  style={{
                    background: ex.color,
                    boxShadow: activeExample === i ? `0 0 8px ${ex.color}` : 'none',
                  }}
                />
                <span className="font-body text-sm font-medium text-slate-300 hidden md:inline">
                  {ex.label}
                </span>
                <span className="font-body text-xs font-medium text-slate-300 md:hidden">
                  {ex.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Output window */}
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
                <span className="font-mono text-xs text-slate-500">
                  syntra-ai — {current.label.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-6 space-y-4 min-h-[280px] max-h-[420px] overflow-y-auto">
              {/* Prompt */}
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <span className="font-mono text-xs text-slate-500 leading-relaxed">
                  {current.prompt}
                </span>
              </div>

              {/* Output */}
              <div className="flex gap-3">
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: current.color }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeExample}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OutputPreview text={current.output} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
