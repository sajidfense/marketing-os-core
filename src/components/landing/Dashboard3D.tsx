import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Particle canvas ─────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const PARTICLE_COUNT = 55;

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
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.15,
    }));

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      // Move
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(99,102,241,${0.18 * (1 - dist / 140)})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }

      // Dots
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
      style={{ opacity: 0.7 }}
    />
  );
}

// ── Mini line-chart SVG ─────────────────────────────────────────────
function MiniChart({ color }: { color: string }) {
  const points = [30, 55, 40, 70, 58, 85, 72, 90, 78, 95];
  const maxH = 60;
  const w = 220;
  const pathD = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * w} ${maxH - (v / 100) * maxH}`)
    .join(' ');
  const areaD = `${pathD} L ${w} ${maxH} L 0 ${maxH} Z`;

  return (
    <svg width={w} height={maxH} viewBox={`0 0 ${w} ${maxH}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Dashboard panel contents ────────────────────────────────────────
function MainPanel() {
  return (
    <div className="p-5 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-[10px] text-slate-500 uppercase tracking-widest">Performance Overview</p>
          <p className="font-display font-bold text-white text-lg leading-none mt-1">Last 30 Days</p>
        </div>
        <div className="flex gap-1">
          {['7D', '30D', '90D'].map((d, i) => (
            <button
              key={d}
              className={`font-body text-[10px] px-2 py-1 rounded ${i === 1 ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-600'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <MiniChart color="#6366F1" />
      <div className="grid grid-cols-3 gap-3 mt-auto">
        {[
          { label: 'Spend', val: '$24,500', up: true },
          { label: 'ROAS', val: '4.2×', up: true },
          { label: 'CPA', val: '$18.40', up: false },
        ].map((m) => (
          <div key={m.label} className="bg-white/3 rounded-lg p-2.5">
            <p className="font-body text-[9px] text-slate-500 uppercase tracking-widest">{m.label}</p>
            <p className={`font-display font-bold text-sm mt-0.5 ${m.up ? 'text-green-400' : 'text-amber-400'}`}>
              {m.val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidePanel({ right }: { right?: boolean }) {
  const bars = right ? [70, 45, 85, 60, 95, 50] : [55, 80, 40, 90, 65, 75];
  const color = right ? '#22D3EE' : '#34D399';
  return (
    <div className="p-4 h-full flex flex-col gap-3">
      <p className="font-body text-[9px] text-slate-500 uppercase tracking-widest">
        {right ? 'Top Campaigns' : 'Budget Split'}
      </p>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%`, background: i === bars.indexOf(Math.max(...bars)) ? color : `${color}44` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 mt-1">
        {['Campaign A', 'Campaign B', 'Campaign C'].map((c, i) => (
          <div key={c} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="font-body text-[9px] text-slate-400">{c}</span>
            </div>
            <span className="font-body text-[9px] font-semibold text-white">
              {['$8.2K', '$6.1K', '$4.8K'][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────
export default function Dashboard3D() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative bg-[#06060E] py-28 px-6 overflow-hidden">
      <ParticleCanvas />

      {/* Centered glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
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
            Live Dashboard
          </p>
          <h2 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white leading-tight tracking-tight">
            Your command center for
            <br />
            <span className="text-gradient">every client account</span>
          </h2>
        </motion.div>

        {/* 3D Panel cluster */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
          style={{ perspective: '1200px' }}
        >
          {/* Left panel */}
          <motion.div
            initial={{ rotateY: 20, x: -40, opacity: 0 }}
            animate={inView ? { rotateY: 12, x: -30, opacity: 0.75 } : {}}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ rotateY: 6, x: -20, opacity: 0.95 }}
            className="absolute left-0 w-[200px] h-[200px] rounded-2xl overflow-hidden hidden md:block"
            style={{
              transformStyle: 'preserve-3d',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <SidePanel />
          </motion.div>

          {/* Center (main) panel */}
          <motion.div
            initial={{ rotateY: -5, scale: 0.9, opacity: 0 }}
            animate={inView ? { rotateY: 0, scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            className="relative z-10 w-full max-w-[500px] h-[280px] rounded-2xl overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.25)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.08)',
            }}
          >
            <MainPanel />
          </motion.div>

          {/* Right panel */}
          <motion.div
            initial={{ rotateY: -20, x: 40, opacity: 0 }}
            animate={inView ? { rotateY: -12, x: 30, opacity: 0.75 } : {}}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ rotateY: -6, x: 20, opacity: 0.95 }}
            className="absolute right-0 w-[200px] h-[200px] rounded-2xl overflow-hidden hidden md:block"
            style={{
              transformStyle: 'preserve-3d',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <SidePanel right />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
