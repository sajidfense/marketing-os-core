import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, BarChart3, FileText, Target } from 'lucide-react';

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const PARTICLE_COUNT = 45;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.4,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(129,140,248,${p.opacity})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.5 }}
    />
  );
}

const panels = [
  {
    icon: Target,
    title: 'Campaign Planner',
    detail: 'Plan, brief, and launch campaigns with structured timelines.',
    color: '#6366F1',
  },
  {
    icon: Calendar,
    title: 'Content Calendar',
    detail: 'Schedule and track every post across channels.',
    color: '#22D3EE',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    detail: 'Real-time performance metrics across all accounts.',
    color: '#34D399',
  },
  {
    icon: FileText,
    title: 'AI Reports',
    detail: 'Board-ready reports generated from live data.',
    color: '#F59E0B',
  },
];

export default function SolutionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative bg-[#06060E] py-28 px-6 overflow-hidden">
      <ParticleCanvas />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-glow"
          style={{
            background:
              'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-4">
            The Solution
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight mb-4">
            Syntra OS replaces your
            <br />
            <span className="text-gradient">entire marketing stack</span>
          </h2>
          <p className="font-body text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            One workspace for strategy, execution, analytics, and AI. Everything
            your team needs — nothing it doesn&apos;t.
          </p>
        </motion.div>

        {/* Dashboard preview panels */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {panels.map((panel, i) => {
            const Icon = panel.icon;
            return (
              <motion.div
                key={panel.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: i * 0.1,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 flex flex-col gap-4 group relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${panel.color}12, transparent 60%)`,
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `${panel.color}15`,
                      border: `1px solid ${panel.color}25`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: panel.color }} />
                  </div>
                  <h3 className="font-display font-bold text-base text-white mb-2">
                    {panel.title}
                  </h3>
                  <p className="font-body text-sm text-slate-400 leading-relaxed">
                    {panel.detail}
                  </p>
                </div>
                <div
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${panel.color}60, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
