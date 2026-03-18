import { motion } from 'framer-motion';

// Realistic agency/brand placeholder names rendered as stylized SVG text
const brands = [
  { name: 'NEXUS', style: 'font-display font-black tracking-widest' },
  { name: 'Waveline', style: 'font-display font-semibold tracking-tight' },
  { name: 'ORBIT', style: 'font-display font-black tracking-[0.2em]' },
  { name: 'Meridian', style: 'font-display font-light tracking-widest italic' },
  { name: 'APEX', style: 'font-display font-black tracking-[0.3em]' },
  { name: 'Stratos', style: 'font-display font-bold tracking-tight' },
];

export default function SocialProof() {
  return (
    <section className="relative bg-[#06060E] border-y border-white/5 py-12 overflow-hidden">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06060E] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06060E] to-transparent z-10 pointer-events-none" />

      <div className="text-center mb-8">
        <p className="font-body text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
          Trusted by performance-driven teams
        </p>
      </div>

      {/* Scrolling marquee */}
      <div className="flex gap-16 animate-[marquee_28s_linear_infinite]">
        {[...brands, ...brands].map((brand, i) => (
          <motion.div
            key={`${brand.name}-${i}`}
            whileHover={{ opacity: 1 }}
            className="flex-shrink-0 flex items-center"
          >
            <span
              className={`${brand.style} text-xl text-white/20 hover:text-white/50 transition-colors duration-300 cursor-default select-none whitespace-nowrap`}
            >
              {brand.name}
            </span>
          </motion.div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
