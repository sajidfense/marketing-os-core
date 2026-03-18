import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Dashboard3D from '@/components/landing/Dashboard3D';
import AIInsights from '@/components/landing/AIInsights';
import Pricing from '@/components/landing/Pricing';
import FinalCTA from '@/components/landing/FinalCTA';

export default function Landing() {
  return (
    <div className="bg-[#06060E] font-body" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <LandingNav />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Dashboard3D />
      <AIInsights />
      <Pricing />
      <FinalCTA />
    </div>
  );
}
