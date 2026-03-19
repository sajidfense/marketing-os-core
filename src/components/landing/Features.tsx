import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Target,
  CalendarDays,
  Palette,
  Brain,
  BarChart3,
  Map,
  ListChecks,
  Users,
  FolderOpen,
  ImageIcon,
  FileText,
  Video,
  MessageSquare,
  BookOpen,
  SearchCheck,
  TrendingUp,
  BarChart,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';

interface Feature {
  icon: typeof Target;
  title: string;
  description: string;
}

interface Pillar {
  id: string;
  label: string;
  color: string;
  features: Feature[];
}

const pillars: Pillar[] = [
  {
    id: 'strategy',
    label: 'Strategy',
    color: '#6366F1',
    features: [
      {
        icon: Target,
        title: 'Campaign Planner',
        description: 'Define objectives, audiences, budgets, and timelines in a structured brief.',
      },
      {
        icon: SearchCheck,
        title: 'SEO Plan',
        description: 'AI-powered keyword research, on-page audits, and ranking strategy.',
      },
      {
        icon: Map,
        title: 'Roadmap',
        description: 'Timeline-based view of your marketing strategy with phases and milestones.',
      },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    color: '#22D3EE',
    features: [
      {
        icon: CalendarDays,
        title: 'Content Calendar',
        description: 'Schedule posts, track deadlines, and manage content across all channels.',
      },
      {
        icon: ListChecks,
        title: 'Task System',
        description: 'Assign, track, and complete marketing tasks with team accountability.',
      },
      {
        icon: Users,
        title: 'Lead Tracking',
        description: 'Capture and nurture leads through your marketing funnel.',
      },
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    color: '#A78BFA',
    features: [
      {
        icon: Palette,
        title: 'Branding Vault',
        description: 'Store logos, colours, fonts, and brand guidelines in one place.',
      },
      {
        icon: FolderOpen,
        title: 'Creative Library',
        description: 'Organise ad creatives, images, and templates for quick access.',
      },
      {
        icon: ImageIcon,
        title: 'Asset Management',
        description: 'Version control and approval workflows for all marketing assets.',
      },
    ],
  },
  {
    id: 'ai-engine',
    label: 'AI Engine',
    color: '#F59E0B',
    features: [
      {
        icon: FileText,
        title: 'Ad Copy Generation',
        description: 'Generate high-converting ad copy for Meta, Google, and more.',
      },
      {
        icon: Video,
        title: 'Video Scripts',
        description: 'AI-written scripts for social video, YouTube, and paid creative.',
      },
      {
        icon: MessageSquare,
        title: 'Social Captions',
        description: 'Platform-optimised captions with hashtags and hooks.',
      },
      {
        icon: BookOpen,
        title: 'Blog Planning',
        description: 'Topic clusters, outlines, and full drafts powered by AI.',
      },
      {
        icon: Brain,
        title: 'SEO Reports',
        description: 'Core Web Vitals audit and AI-generated action plans.',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    color: '#34D399',
    features: [
      {
        icon: BarChart3,
        title: 'Meta Ads Analytics',
        description: 'Real-time ROAS, CPA, and creative performance from your connected accounts.',
      },
      {
        icon: BarChart,
        title: 'Google Ads Integration',
        description: 'Pull in Google Ads data for cross-platform performance views.',
      },
      {
        icon: TrendingUp,
        title: 'SEMrush Data',
        description: 'Keyword rankings, backlinks, and competitive intelligence.',
      },
      {
        icon: Lightbulb,
        title: 'AI Recommendations',
        description: 'Actionable insights generated from your connected data sources.',
      },
    ],
  },
];

export default function Features() {
  const [activePillar, setActivePillar] = useState(0);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const current = pillars[activePillar];

  return (
    <section id="features" className="bg-[#08080F] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">
            Features
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            Everything you need to{' '}
            <br className="hidden md:block" />
            <span className="text-gradient">plan, execute, and scale</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-xl mx-auto">
            Five pillars. One platform. Zero tool sprawl.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Pillar tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {pillars.map((pillar, i) => (
              <button
                key={pillar.id}
                onClick={() => {
                  setActivePillar(i);
                  setExpandedFeature(null);
                }}
                className={`font-body text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 ${
                  activePillar === i
                    ? 'text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300 bg-white/3 hover:bg-white/5'
                }`}
                style={
                  activePillar === i
                    ? {
                        background: `${pillar.color}18`,
                        border: `1px solid ${pillar.color}35`,
                        boxShadow: `0 0 20px ${pillar.color}15`,
                      }
                    : { border: '1px solid transparent' }
                }
              >
                {pillar.label}
              </button>
            ))}
          </div>

          {/* Feature cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {current.features.map((feat) => {
                const Icon = feat.icon;
                const isExpanded = expandedFeature === feat.title;

                return (
                  <motion.div
                    key={feat.title}
                    onClick={() =>
                      setExpandedFeature(isExpanded ? null : feat.title)
                    }
                    whileHover={{ scale: 1.015 }}
                    className="glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden group"
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                      style={{ background: `${current.color}15` }}
                    />

                    <div className="relative z-10">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: `${current.color}12`,
                          border: `1px solid ${current.color}22`,
                        }}
                      >
                        <Icon
                          className="w-4.5 h-4.5"
                          style={{ color: current.color }}
                        />
                      </div>
                      <h3 className="font-display font-bold text-base text-white mb-1.5">
                        {feat.title}
                      </h3>

                      <AnimatePresence>
                        {isExpanded ? (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="font-body text-sm text-slate-300 leading-relaxed overflow-hidden"
                          >
                            {feat.description}
                          </motion.p>
                        ) : (
                          <p className="font-body text-sm text-slate-500 line-clamp-1">
                            {feat.description}
                          </p>
                        )}
                      </AnimatePresence>

                      <div className="mt-3 flex items-center gap-1">
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown
                            className="w-3.5 h-3.5"
                            style={{
                              color: isExpanded ? current.color : '#475569',
                            }}
                          />
                        </motion.span>
                      </div>
                    </div>

                    <div
                      className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${current.color}50, transparent)`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
