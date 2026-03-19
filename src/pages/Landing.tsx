import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import ProblemSection from '@/components/landing/HowItWorks';
import SolutionSection from '@/components/landing/Dashboard3D';
import Features from '@/components/landing/Features';
import Timeline from '@/components/landing/Timeline';
import AIEngine from '@/components/landing/AIInsights';
import CreditSystem from '@/components/landing/CreditSystem';
import Integrations from '@/components/landing/Integrations';
import Pricing from '@/components/landing/Pricing';
import FinalCTA from '@/components/landing/FinalCTA';

export default function Landing() {
  return (
    <div className="bg-[#06060E] font-body" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <LandingNav />
      <Hero />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <Features />
      <Timeline />
      <AIEngine />
      <CreditSystem />
      <Integrations />
      <Pricing />
      <FinalCTA />
    </div>
  );
}
